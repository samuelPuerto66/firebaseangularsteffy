import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError} from 'rxjs';
import { catchError,map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

interface PeticionGemini {
  contents: contentGemini[];
  generationConfig?:{
    maxOutputTokens?:number;
    temperature?:number;
  }
  safetySettings: safetySetting[];
}

interface contentGemini {
  role: 'user' | 'model';
  parts: partGemini[];
}

interface partGemini {
  text: string
}

interface safetySetting {
  category: string;
  threshold: string;
}

interface RespuestaGemini {
  candidates:{
    content:{
      parts:{
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  usageMetaData?:{
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number
  };
}

@Injectable({
  providedIn: 'root',
})

export class GeminiService {

  //inyección de dependencias
  private http = inject(HttpClient)

  //variables que llevan la URL
  private apiUrl = environment.gemini.apiURL
  private apiKey = environment.gemini.apiKey

  enviarMensaje(mensaje: string, historialPrevio: contentGemini[] = []): Observable<string> {

    // verificar si la API key está configurada
    if (!this.apiKey || this.apiKey === 'Tu_api_key_de_gemini') {
      console.error('Error: la api key no está configurada')

      return throwError(() =>
        new Error('Api de Gemini no configurada correctamente')
      )
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    })

    const mensajeSistema: contentGemini={
      role:'user',
      parts:[{
        text: "Eres un asistente virtual util y respetuoso., responde siempre en español de manera concisa. Erres especialista en preguntas generales y sobrtodo en programacion de software.  Manten un tono profecional pero cercano"
      }]
    }

    const respuestaSistema: contentGemini = {
      role: 'model',
      parts: [{
        text: 'Entendido, soy tu asistente virtual especializado en programación de software, ¿en qué puedo ayudarte?'
    }]
  };

    const contenido: contentGemini[] =[
      mensajeSistema,
      respuestaSistema,
      //traer el historial previo
      ...historialPrevio,{
        role:'user',
      parts:[{text: mensaje}]

      }
    ];

    const configurarionesSeguridad: safetySetting[]=[
      {
        category:"HARM_CATEGORY_HARASSMENT",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category:"HARM_CATEGORY_HATE_SPEECH",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category:"HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category:"HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      }
    ];

    const cuerpoPeticion: PeticionGemini={
      contents: contenido,
      generationConfig:{
        maxOutputTokens:800,
        temperature:0.7
      },
      safetySettings: configurarionesSeguridad
    };

    //vamos a generar la irl completa
    const urlCompleta = `${this.apiUrl}?key=${this.apiKey}`;
    // hacer la peticion de HTTP de conectarnos a la API de gemini
    return this.http.post<RespuestaGemini>(urlCompleta, cuerpoPeticion,{headers})
    .pipe(
      map( respuesta =>{
        //vamos a revisar que la respuesta tenga un formato correcto
        if(respuesta.candidates && respuesta.candidates.length>0){
          const candidate = respuesta.candidates[0];
          if(candidate.content && candidate.content.parts && candidate.content.parts.length>0){
            let contenidoRespuesta = candidate.content.parts[0].text;

            //validacion por si la respuesta es erroena por el limite tojens
            if (candidate.finishReason === "MAX_TOKENS"){
              contenidoRespuesta += "\n\n[nota: Respuesta truncada por limite de tokens, puedes pedirme que continue de nuevo]"
            }
            return contenidoRespuesta;
          }else{
            throw new Error('respuesta de no contiene un formato valido');
          }
        }else{
          throw new Error('respuesta no contiene un formato esperado')
        }
      }),
      catchError(error=>{
        console.log("error al comunicarse con gemini ", error )
        let mensajeError="Error al conctarse con gemini"

        if(error.status === 400){
          mensajeError = "Error peticion invalida a gemin, verifique la configuracion"
        }else if(error.status === 429){
          mensajeError="has excedido el limite de peticiones a gemini,intenta mas tarde"
        }else if(error.status===500){
          mensajeError= "Error con el sevidor de gemini"
        }
        return throwError(()=> new Error(mensajeError));
      })
    )
  }
  //funcion para convertir al formato de gemini

  convertirHistorialGemini(mensaje: any[]): contentGemini[]{
    const historialConvertido: contentGemini[] = mensaje.map(msg => ({
      role: (msg.tipo === 'Usuario' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.contenido }]
    }));

    if (historialConvertido.length > 8) {
      const ultimosMensajes = historialConvertido.slice(-8);
      if (ultimosMensajes.length > 0 && ultimosMensajes[0].role === 'model') {
        return ultimosMensajes.slice(1);
      }
      return ultimosMensajes;
    }
    return historialConvertido;
  }
  verificarConfiguracion(): boolean {
    const configuracionValida = !!(this.apiKey && this.apiKey !== "Tu_api_key_de_gemini" && this.apiUrl);
    return configuracionValida;
}
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, pipe, throwError} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';


interface ContentGemini{
  role: 'user' | 'model';
  parts: PartGemini[] ; 
}

interface PartGemini{
  text: string;
}

interface RespuestaGemini{
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string
  }[];
  promptFeedback?: {
    blockReason: string;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}



@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  //inyecciones de dependecias
   private http = inject(HttpClient)

  //variabels que llevan la url
  private apiURL = environment.gemini.apiURL
  private apiKey = environment.gemini.apiKey

   enviarMensaje(mensaje: string, HitorialPrevio: ContentGemini[]=[]): Observable<string>{
    //verificar si la URL esta bien configurada
    if(!this.apiKey || this.apiKey === 'Tu_api__key_de_gemini'){
      console.error('Error la api key no esta configurada')
      return throwError(()=> new Error ('Api de gemini no configurada correctamente'))
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    })

    // Mensaje del sistema
    const systemInstruction = "Eres un asistente virtual util y amigable, responde siempre en español y con acento paisa de manera concisa. Eres especialista en preguntas generales y sobretudo en programacion de Software. Manten un tono Profesional y jugueton y cercano";

    // Construir el contenido de la conversación
    const contents: ContentGemini[] = [
      ...HitorialPrevio,
      {
        role: 'user',
        parts: [{
          text: mensaje
        }]
      }
    ];

    // Cuerpo de la petición simplificado
    const cuerpoPeticon: any = {
      contents: contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.5
      }
    };

    // Agregar systemInstruction solo si es la primera petición (sin historial)
    if(HitorialPrevio.length === 0){
      cuerpoPeticon.systemInstruction = {
        role: 'user',
        parts: [{ text: systemInstruction }]
      };
    }

    // vamos a generar la url completa
    const urlCompleta = `${this.apiURL}?key=${this.apiKey}`;
    
    console.log('Enviando petición a Gemini...');
    console.log('URL:', urlCompleta);
    console.log('Cuerpo:', JSON.stringify(cuerpoPeticon, null, 2));
    
    // hacer la peticion a Http de conectarnos a la api de gemini
    return this.http.post<RespuestaGemini>(urlCompleta, cuerpoPeticon, { headers: headers })
    .pipe(
      map(respuesta=>{
        console.log('Respuesta de Gemini:', respuesta);
        
        // Verificar si la respuesta fue bloqueada
        if(respuesta.promptFeedback && respuesta.promptFeedback.blockReason){
          throw new Error('La solicitud fue bloqueada: ' + respuesta.promptFeedback.blockReason);
        }
        
        //vamos a revisar que la respuesta tenga un formato correcto
        if(respuesta.candidates && respuesta.candidates.length > 0)
        {
          const candidate = respuesta.candidates[0];
          
          // Verificar si fue bloqueado por seguridad
          if(!candidate.content){
            throw new Error('Respuesta bloqueada por políticas de seguridad');
          }
          
          if(candidate.content.parts && candidate.content.parts.length > 0)
          {
            let contenidoRespuesta = candidate.content.parts[0].text;

            //validacion por si la respuesta es erronea por el limite de tokens
            if(candidate.finishReason ==='MAX_TOKENS'){
              contenidoRespuesta += "\n\n[Nota: respuesta truncada debido al límite de tokens]";
            }
            return contenidoRespuesta;
          }else{
            throw new Error('Respuesta no contiene un formato valido');
          }
        }else{
          throw new Error('Respuesta no contiene candidatos')
        }
      }),
      catchError(error =>{
        console.error("Error al comunicarse con gemini:", error);
        
        // Intentar obtener más información del error
        let mensajeError = 'Error al comunicarse con Gemini';
        
        if(error.error && error.error.error){
          // Error detallado de Google API
          console.log('Error detallado de Google:', error.error.error);
          mensajeError = error.error.error.message || mensajeError;
        }else if(error.status ===0){
          // Error de conexión
          mensajeError = 'Error de conexión, verifique su internet';
        }else if(error.status ===400){
          // Error de formato - mostrar más info
          console.log('Cuerpo de petición enviado:', JSON.stringify(cuerpoPeticon, null, 2));
          console.log('URL:', urlCompleta);
          mensajeError = 'Solicitud inválida. Verifique el formato de los datos enviados.';
        }else if(error.status === 403){
          mensajeError = 'Acceso a Gemini prohibido, revise su API Key y permisos';
        }else if(error.status === 429){
          mensajeError = 'Has excedido el limite de peticiones a Gemini, por favor intente mas tarde';
        }else if(error.status ===500){
            mensajeError = 'Error interno en Gemini, por favor intente mas tarde';
        }
        
        // Incluir el mensaje original
        if(error.message && error.message !== 'Error al comunicarse con Gemini'){
          mensajeError = error.message;
        }
        
        return throwError(()=> new Error(mensajeError));
        })
    )
  }

  // funcion para convertir al formato de gemini
  convertirHistorialGemini(mensaje: any[]): ContentGemini[]{
    const historialConvertido: ContentGemini[]= mensaje.map(msg=>(
      {
      role: (msg.tipo === 'usuario' ? 'user' : 'model') as 'user' | 'model',
      parts: [{text: msg.contenido}]
    }
    ));
    if(historialConvertido.length > 8){
      const ultimosMensajes = historialConvertido.slice(-8);
      
      if (ultimosMensajes.length > 0 && ultimosMensajes[0].role === 'model') {
        return ultimosMensajes.slice(1)
      }
      return ultimosMensajes;
    }
    return historialConvertido;
  }

  verificarConfiguracion(): boolean{
    const configuracionValida = !! (this.apiKey && this.apiKey !== 'Tu_api__key_de_gemini' && this.apiURL);
    console.log('Configuración de Gemini:', { apiURL: this.apiURL, apiKey: this.apiKey ? '***' : 'undefined', valid: configuracionValida });
    return configuracionValida;
  }
  
}
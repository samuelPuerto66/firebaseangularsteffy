import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { from } from 'rxjs';
import { Observable, throwError }   from 'rxjs';
import {map, catchError} from 'rxjs/operators'
import { environment } from '../../environments/environment'; 
import { Block } from '@angular/compiler';


interface PeticionGemini{
  contents: ContentGemini[];
  generationConfig?:{
    maxOuputTokens?:number;
    temperature?: number;
    }
    safetySettings: SafetySetting[]; 

}
interface ContentGemini{
  role: 'user' | 'model';
  parts: PartGemini[] ; 
}

interface PartGemini{
  text: string;
}
interface SafetySetting{
  category: string;
  threshold: string;
}

interface RespuestasGemini{
  candidate:{
    content:{
      parts:{
        text: string;
      }[];
    };
    finishReason : string;
  }[];
  usageMetaData?:{
    promptTokenCount: number;
    candydatesTokenCount: number;
    totalTokenCount: number
  };
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
 //inyecciones de dependencias
 private http = inject (HttpClient)
 
 //Variables que llevan la url
 private apiUrl = environment.gemini.apiURL
 private apiKey = environment.gemini.apiKey

 enviarMensaje(mensaje: string, historialPrevio: ContentGemini[]=[]): Observable<string>{
  //verficar si la URL esta bien configurada
  if(!this.apiKey || this.apiKey ===  'Tu_api_key_de_gemini'){
    console.error ('Error la api key no esta configurada')
      return throwError(()=> new Error('api de gemini no configurada correctamente'))
  }

  const headers = new HttpHeaders({
    'Content-Type' : ' application/json'
  })

  //vamos a enviar un mensaje al contenido del sistema
  
     const mensajeSistema: ContentGemini = {
      role: 'user',
      parts:[{
        text: "Eres un asistente virtual util y amigable., responde siempre en español de manera concisa. Eres especialista  en preguntas generales y sobretodo en progrmacion de sofware. manten un tono profesional  pero cercano"
      }]
     }
     const respuestasSistema: ContentGemini = {
      role: 'model',
      parts: [{
        text: ' Entendido, soy tu asistente virtual especializado en programacion de software, te contestare en español ¿En que puedo ayudarte?'
      }]
     }
 


  const contenido: ContentGemini[]=[
     mensajeSistema,
     respuestasSistema,
     //traer el historial previo 
    ...historialPrevio,
    {
      role:'user',
      parts:[{text:mensaje}]
    }
  ];


  const configuracionesSeguridad: SafetySetting[]=[
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold:"BLOCK_MEDIUM_AND_ABOVE"
    },
    {
     category:"HARM_CATEGORY_SEXUALLY_EXPLICIT",
     threshold:"BLOCK_MEDIUM_AND_ABOVE"

    },
    {
      category:"HARM_CATEGORY_DANGEROUS_CPNTENT",
      threshold:"BLOCK_MEDIUM_AND_ABOVE"
    }
  ];

   

   const cuerpoPeticion:PeticionGemini={
    contents:contenido,
    generationConfig:{
      maxOuputTokens:800,
      temperature:0.7
    },
    safetySettings: configuracionesSeguridad

   };
  // VAMOS A GENERAR LA url completa 
  const urlcompleta = `${this.apiUrl}?key=${this.apiKey}`

  // hacer la peticion a http de contarnos a la api gemini

  return this.http.post<RespuestasGemini>(urlcompleta,cuerpoPeticion,{headers})
  .pipe(
    map(respuesta =>{
      //vamos a revisar que la respuesta tenga un fromato
      if (respuesta.candidate && respuesta.candidate.length>0){
        const candidate = respuesta.candidate[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length>0){
          let contenidoRespuesta = candidate.content.parts[0].text;

          //Validacion por si la respuesta es erronea por el limite de tokens

          if(candidate.finishReason === "MAX_TOKENS"){
            contenidoRespuesta += "\n\n[notas: Respuesta truncada por limite de tokens, puedes pedirme que continue de nuevo]"
          }
          return contenidoRespuesta;
        }else{
          throw new Error('Respuesta de no contiene un formato valido');
        }
      }else{
        throw new Error ('Respuesta no contiene un formato esperado')
      } 
    }),
    catchError(error =>{
      console.log("error al comunicarse con gemini")
      let mensajeError = ' Error al conectarse con gemini'
      if(error.status === 400){
        mensajeError = "Error peticion invalida a gemini, verifique la confiaguracion"
      }else if(error.status === 403){
        mensajeError = "Error en la clave de API no valid o sin permisos"
      } else if (error.status === 429){
        mensajeError = "Has excedido el limite de peticiones a gemini, intenta mas tarde"
      }else if( error.status === 500){
        mensajeError = "Error con el sevidor de gemini"
      }
      return throwError(()=> new Error (mensajeError))
    })
  )
}

//funcion para convertir al formato de gemini
convertirHistorialGemini(mensaje: any[]): ContentGemini[]{
  const historialConvertido: ContentGemini[] = mensaje.map(msg =>(
      {
      role: (msg.tipo === 'usuario' ? 'user' : 'model' ) as 'user' |'model',
      parts: [{text: msg.contenido}]
      }
  ));

    if(historialConvertido.length>8){
      const ultimosMensajes = historialConvertido.slice(-8)

      if(ultimosMensajes.length>0 && ultimosMensajes[0].role ==='model'){
        return ultimosMensajes.slice(1);

      }
      return ultimosMensajes;
    }
    return historialConvertido;

    
  }
  verificarConfiguracion(): boolean{
      const configuracionValida = !! (this.apiKey && this.apiKey !== "Tu_api_key_de_gemini" && this.apiUrl);
      return configuracionValida;
    }
}

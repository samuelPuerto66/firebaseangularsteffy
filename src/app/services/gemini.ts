import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { from } from 'rxjs';
import { Observable, throwError }   from 'rxjs';
import {map, catchError} from 'rxjs/operators'
import { environment } from '../../environments/environment'; 


interface PeticionGemini{
  contents: ContentGemini[];
  generationConfig?:{
    maxOuputTokens?:number;
    tempertature?: number;
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
 }
}

import { Injectable, inject } from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject } from 'rxjs';
import { Firestore, FirestoreError } from '@angular/fire/firestore';

//Vamos a generar un mock del servicio de gemini
const geminiServiceMock = {
  convertirHistorialGemini: (historial: MensajeChat[]) => historial,
  enviarMensaje : async (contenido : string, historial: any) =>'respuesta desde  el servicio de gemini de tipo mock, esta respuesta siempre va a ser igual'
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private authService = inject(AuthService);

  private firebaseService = inject(FirebaseService);

  private mensajeSubject = new BehaviorSubject<MensajeChat[]>([]);

  public mensaje$ = this.mensajeSubject.asObservable();

  private cargandoHistorial = false;

  private asistenteRespondiendo = new BehaviorSubject<boolean>(false);
  private asistenteRespondiendo$ = this.asistenteRespondiendo.asObservable
  ();

  async InicializarChat(usuarioId: string ): Promise<void> {
    if (this.cargandoHistorial) {
      return;
    }
    this.cargandoHistorial = true;
    try{
      this.firebaseService.obtenerMensajesUsuario(usuarioId).subscribe({
        next: (mensajes) => {
          //actualizando el behavior subject con los mensajes obtenidos
          this.mensajeSubject.next(mensajes)
          this.cargandoHistorial = false;
        },
        error: (error) => {
          console.log('error al obtener mensajes', error)
          this.cargandoHistorial = false;
          //cargar con una lista vacia el behavior subject para evitar que quede en un estado de carga infinita
          this.mensajeSubject.next([]);
        }
      })

    }catch(error){
      console.log('error al cargar el historial', error)
      this.cargandoHistorial = false;
      this.mensajeSubject.next([]);
      throw error;
    }
   }
  async enviarMensaje(contenidoMensaje: string): Promise<void>{
    const usuarioActual = this.authService.obtenerUsuario()
    
    if (!usuarioActual) {
      console.error('usuario no autenticado');
      throw Error;
    }
    if(!contenidoMensaje.trim()){
      return ; 
  } 
  const mensajeUsuario: MensajeChat = {
      usuarioId: usuarioActual.uid,
      contenido: contenidoMensaje.trim(),
      fechaEnvio: new Date(),
      estado: 'Enviado',
      tipo: 'Usuario'
    }
    try {
      const mensajeDelUsuario = this.mensajeSubject.value;
      
      const nuevoMensajeEncontrado = [...mensajeDelUsuario, mensajeUsuario];
      this.mensajeSubject.next(nuevoMensajeEncontrado);
      
      try {
        await this.firebaseService.guardarMensaje(mensajeUsuario);
      } catch (firestoreError) {
        console.error('Error al guardar el mensaje en Firestore', firestoreError);
  }
  

  this.asistenteRespondiendo.next(true);

  const mensajesActuales = this.mensajeSubject.value;


  const historialParaGemini = geminiServiceMock.convertirHistorialGemini(
    mensajesActuales.slice(-6)
  );
    const respuestaAsistente = await geminiServiceMock.enviarMensaje(
     contenidoMensaje,
      historialParaGemini
    )

    //configurar los mensajes del asistente
    const mensajeAsistente: MensajeChat = {
      usuarioId: usuarioActual.uid,
      contenido: respuestaAsistente,
      fechaEnvio: new Date(),
      estado: 'Enviado',
      tipo: 'Asistente'

    };
     const mensajesActualizados = this.mensajeSubject.value
      const nuevoMensajesEncontradoAsis = [...mensajesActualizados, mensajeAsistente];
      this.mensajeSubject.next(nuevoMensajesEncontradoAsis);
      try{
        await this.firebaseService.guardarMensaje(mensajeAsistente);
      }catch (error){
        console.error('Error al guardar el mensaje del asistente en Firestore', FirestoreError)
      }



} catch (error) {
  console.error('Error al enviar el mensaje', error)
  const mensajeError: MensajeChat = {
    usuarioId: usuarioActual.uid,
    contenido: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta nuevamente.',
    fechaEnvio: new Date(),
    estado: 'Error',
    tipo: 'Asistente'
 
  };

  try {
    await this.firebaseService.guardarMensaje(mensajeError);
  }catch (saveError){
    console.error('Error al guardar el mensaje de error en Firestore', saveError);
    const mensajesActual = this.mensajeSubject.value;
    this.mensajeSubject.next([...mensajesActual, mensajeError]);
  }
  throw error;
}finally {
  this.asistenteRespondiendo.next(false);
}


 }
 limpiarChat(): void{
  this.mensajeSubject.next([])
 }

 obtenerMensajes(): MensajeChat[]{
  return this.mensajeSubject.value;
 }


}

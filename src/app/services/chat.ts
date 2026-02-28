import { Injectable, inject } from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

//Vamos a generar un mock del servicio de gemini
const geminiServiceMock = {
  convertirHistorialGemini: (historial: MensajeChat[]) => historial,
  enviarMensaje : async (contenido : string, historial: any) =>'respuesta desde  el servicio de gemini de tipo mock, esta respuesta siempre va a ser igual'
}
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

  }
  }

}

import { Injectable, inject } from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { GeminiService } from './gemini';

// vamos a generar un mock del servicio de gemini
const geminiServiceMock = {
  convertirHistorialGemini: (historial: MensajeChat[]) => historial,
  enviarMensaje: async (contenido: string, historial: any) =>
    'Respuesta desde el servicio de gemini de tipo mock, esta respuesta siempre va ser igual',
};

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private authService = inject(AuthService);

  private firebaseService = inject(FirebaseService);

  private geminiService = inject(GeminiService);

  private mensajeSubject = new BehaviorSubject<MensajeChat[]>([]);

  public mensajes$ = this.mensajeSubject.asObservable();

  private cargandoHistorial = false;

  private asistenteRespondiendo = new BehaviorSubject<boolean>(false);

  public asistenteRespondiendo$ = this.asistenteRespondiendo.asObservable();

  async inicializarChat(usuarioId: string): Promise<void> {
  // Validación de seguridad
  if (!usuarioId || this.cargandoHistorial) {
    return;
  }

  this.cargandoHistorial = true;
    try {
      this.firebaseService.obtenerMensajesUsuario(usuarioId).subscribe({
        next: (mensajes) => {
          // ordenamos el historico por fecha (del más antiguo al más reciente)
          const mensajesOrdenados = [...mensajes].sort((a, b) => {
            const fechaA = a.fechaEnvio instanceof Date
              ? a.fechaEnvio
              : (a.fechaEnvio as any)?.toDate?.();
            const fechaB = b.fechaEnvio instanceof Date
              ? b.fechaEnvio
              : (b.fechaEnvio as any)?.toDate?.();
            if (fechaA && fechaB) {
              return fechaA.getTime() - fechaB.getTime();
            }
            return 0;
          });
          this.mensajeSubject.next(mensajesOrdenados);
          this.cargandoHistorial = false;
        },
        error: (error) => {
          console.log('error al cargar el historial', error);
          this.cargandoHistorial = false;
          //cargar con una lista vacia el BehaviorSubject
          this.mensajeSubject.next([]);
        },
      });
    } catch (error) {
      console.error('error al cargar el historial', error);
      this.cargandoHistorial = false;
      this.mensajeSubject.next([]);
      throw error;
    }
  }

  async enviarMensaje(contenidoMensaje: string): Promise<void> {
    console.log('ingreso a la funcion enviarMensaje servicio');
    const usuarioActual = this.authService.obtenerUsuario();
    console.log(usuarioActual);

    if (!usuarioActual) {
      console.error('No  hay un usuario autenticado');
      throw new Error('No hay un usuario autenticado');
    }
    if (!contenidoMensaje.trim()) {
      console.log('mensaje vacio');
      return;
    }

    const mensajeUsuario: MensajeChat = {
      usuarioId: usuarioActual.uid,
      contenido: contenidoMensaje.trim(),
      fechaEnvio: new Date(),
      estado: 'Enviado',
      tipo: 'Usuario',
    };
    try {
      console.log('ingreso al try, enviar mensajes service');
      const mensajeDelUsuario = this.mensajeSubject.value;

      const nuevoMensajeEncontrado = [...mensajeDelUsuario, mensajeUsuario];
      this.mensajeSubject.next(nuevoMensajeEncontrado);

      try {
        console.log('ingreso al try mensaje service, llamar a firebase ');
        await this.firebaseService.guardarMensaje(mensajeUsuario);
        console.log('exito');
      } catch (firestoreError) {
        console.error('No se puedo guardar el mensaje', firestoreError);
      }

      this.asistenteRespondiendo.next(true);
      const mensajesActuales = this.mensajeSubject.value;

      const historialParaGemini = this.geminiService.convertirHistorialGemini(
        mensajesActuales.slice(-6),
      );

      let respuestaAsistente = 'No se obtuvo respuesta del asistente';
      try {
        respuestaAsistente = await firstValueFrom(
          this.geminiService.enviarMensaje(contenidoMensaje, historialParaGemini)
        );
      } catch (geminiError) {
        console.error('Error en Gemini:', geminiError);
        respuestaAsistente = 'No pude conectar con Gemini. Intenta nuevamente.';
      }

      // configurar los mensajes para el asistente
      const mensajeAsistente: MensajeChat = {
        usuarioId: usuarioActual.uid,
        contenido: respuestaAsistente,
        fechaEnvio: new Date(),
        estado: 'Enviado',
        tipo: 'Asistente',
      };

      const mensajesActualizados = this.mensajeSubject.value;
      const nuevoMensajeEncontradoAsis = [...mensajesActualizados, mensajeAsistente];
      this.mensajeSubject.next(nuevoMensajeEncontradoAsis);

      try {
        await this.firebaseService.guardarMensaje(mensajeAsistente);
        console.log('exito 2');
      } catch (error) {
        console.error('error al guardar el mensaje', error);
      }
    } catch (error) {
      console.error('error al enviar mensaje', error);

      const mensajeError: MensajeChat = {
        usuarioId: usuarioActual.uid,
        contenido: 'Error al responder',
        fechaEnvio: new Date(),
        estado: 'Error',
        tipo: 'Asistente',
      };

      // Siempre actualizar UI con el mensaje de error
      const mensajesActual = this.mensajeSubject.value;
      this.mensajeSubject.next([...mensajesActual, mensajeError]);

      try {
        await this.firebaseService.guardarMensaje(mensajeError);
      } catch (saveError) {
        console.error('error al guardar el mensaje', saveError);
      }

      throw error;
    } finally {
      this.asistenteRespondiendo.next(false);
      console.log('ABAC');
    }
  }
  limpiarChat(): void {
    this.mensajeSubject.next([]);
  }

  obtenerMensajes(): MensajeChat[] {
    return this.mensajeSubject.value;
  }
}
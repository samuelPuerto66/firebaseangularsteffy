import { Injectable, inject } from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { GeminiService } from './gemini';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private authService = inject(AuthService);
  private geminiService = inject(GeminiService);
  private firebaseService = inject(FirebaseService);

  private mensajeSubject = new BehaviorSubject<MensajeChat[]>([]);
  public mensajes$ = this.mensajeSubject.asObservable();

  private cargandoHistorial = false;
  private asistenteRespondiendo = new BehaviorSubject<boolean>(false);
  public asistenteRespondiendo$ = this.asistenteRespondiendo.asObservable();

  async InicializarChat(usuarioId: string): Promise<void> {
    if (this.cargandoHistorial) {
      return;
    }
    this.cargandoHistorial = true;
    try {
      this.firebaseService.obtenerMensajesUsuario(usuarioId).subscribe({
        next: (mensajes) => {
          this.mensajeSubject.next(mensajes);
          this.cargandoHistorial = false;
        },
        error: (error) => {
          console.error('error al cargar el historial', error);
          this.cargandoHistorial = false;
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
    const usuarioActual = this.authService.obtenerUsuario();
    if (!usuarioActual) {
      console.error('No hay un usuario autenticado');
      throw new Error('No hay usuario autenticado');
    }

    if (!contenidoMensaje.trim()) {
      return;
    }

    const mensajeUsuario: MensajeChat = {
      usuarioId: usuarioActual.uid,
      contenido: contenidoMensaje.trim(),
      fechaEnvio: new Date(),
      estado: 'Temporal',
      tipo: 'Usuario',
    };

    try {
      const mensajesActuales = this.mensajeSubject.value;
      this.mensajeSubject.next([...mensajesActuales, mensajeUsuario]);

      try {
        await this.firebaseService.guardarMensaje(mensajeUsuario);
      } catch (firestoreError) {
        console.error('No se pudo guardar el mensaje', firestoreError);
      }

      this.asistenteRespondiendo.next(true);
      const historialParaGemini = this.geminiService.convertirHistorialGemini(
        mensajesActuales.slice(-6)
      );

      const respuestaAsistente = await firstValueFrom(
        this.geminiService.enviarMensaje(contenidoMensaje, historialParaGemini)
      );

      const mensajeAsistente: MensajeChat = {
        usuarioId: usuarioActual.uid,
        contenido: respuestaAsistente,
        fechaEnvio: new Date(),
        estado: 'Enviado',
        tipo: 'Asistente',
      };

      this.mensajeSubject.next([...this.mensajeSubject.value, mensajeAsistente]);

      try {
        await this.firebaseService.guardarMensaje(mensajeAsistente);
      } catch (firestoreError) {
        console.error('error al guardar el mensaje', firestoreError);
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
      this.mensajeSubject.next([...this.mensajeSubject.value, mensajeError]);
      try {
        await this.firebaseService.guardarMensaje(mensajeError);
      } catch (saveError) {
        console.error('error al guardar el mensaje', saveError);
      }
      throw error;
    } finally {
      this.asistenteRespondiendo.next(false);
    }
  }

  limpiarChat(): void {
    this.mensajeSubject.next([]);
  }

  obtenerMensajes(): MensajeChat[] {
    return this.mensajeSubject.value;
  }
}

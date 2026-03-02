import { Component, ViewChild, ElementRef, contentChild, viewChild, inject } from '@angular/core';
import { MensajeChat } from '../../../models/chat';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})


export class Chat {

  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private route = inject(Router);


  @ViewChild('messagesContainer') messagesContainer!: ElementRef
  usuario : User  | null = null;
  mensajes: MensajeChat[] = []
  asistenteEscribiendo = false
  mensajeTexto = ""
  enviandoMensaje = false
  cargandoHistorial = false
  mensajeError = ""
  private debeHacerScroll = true;
 private  suscripciones : Subscription[] = [];


 private async verificarAutenticacion(): Promise<void> {
  // a la variable usuario le voy a asignar el resultado de obtenerUsuario del authService
   this.usuario = this.authService.obtenerUsuario()

  if (!this.usuario) {
    await this.route.navigate(['/auth'])
    throw new Error('Usuario no autenticado')
  }
 }
   
  private async inicializarChat(): Promise<void> {
    if (!this.usuario) {
      return;
    }

    this.cargandoHistorial = true;
    try {
      await this.chatService.InicializarChat(this.usuario.uid);
    } catch (error) {
      console.error('Error al inicializar chat:', error);
    } finally {
      this.cargandoHistorial = false;
    }
  }

  formatearMensajeAsistente(mensaje: string) {
    return mensaje
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  trackByMensaje(index: number, mensaje: MensajeChat) {
    return mensaje.id || index;
  }

  ManejoErrorImagen() {
    this.mensajeError = 'Error al cargar la imagen';
  }

  cerrarsesion() {
    this.authService.cerrarSesion();
  }

  private scrollHaciaAbajo(): void {
    try {
      const container = this.messagesContainer?.nativeElement
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    } catch (error) {
      console.error('❌ error al hacer scroll')
    }

  }


  ngAfterViewChecked(): void {
    if (this.debeHacerScroll) {
      this.debeHacerScroll = false
      this.scrollHaciaAbajo();
    }
  }

formatearHora(fecha: Date): string{
  return fecha.toLocaleTimeString('es-ES',{
    hour: '2-digit',
    minute: '2-digit'
  })
}

  enviarMensaje() {
  }



  ngOnInit() {
    
  }
  
}
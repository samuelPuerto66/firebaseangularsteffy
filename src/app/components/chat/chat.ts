import { Component, ViewChild, ElementRef, contentChild, viewChild } from '@angular/core';
import { MensajeChat } from '../../../models/chat';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})


export class Chat {
  nombre: string = "Samuel Puerto M."
  email: string = "samuelpuerto066@gmail.com"
  asistenteEscribiendo = false
  mensajeTexto = ""
  enviandoMensaje = false


  enviarMensaje() {
  }


  formatearMensajeAsistente(mensaje: string) {
    return mensaje
      .replace(/\n/g, '<br>')
       .replace (/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace (/\*(.*?)\*/g, '<em>$1</em>')
    }



  mensajes: MensajeChat[] = []
  cargandoHistorial = false
  private debeHacerScroll = true;



  trackByMensaje(index: number, mensaje: MensajeChat) {
  }


  ManejoErrorImagen() {
  }


  cerrarsesion() {
  }



  // referenciar los contenedores
  @ViewChild('messagesContainer') messagesContainer!: ElementRef

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

  ngOnInit() {
    this.mensajes = this.generarMensajeDemo();
  }
  private generarMensajeDemo(): MensajeChat[] {
    const ahora = new Date();

    return [
      {
        id: 'id1',
        contenido: 'Hola eres el Asistente?',
        tipo: 'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u1',

      }, {
        id: 'id2',
        contenido: 'Hola soy tu Asistente',
        tipo: 'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u2',
      }, {
        id: 'id1',
        contenido: 'Necesito esta cita para mañana ',
        tipo: 'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u1',
      }, {
        id: 'id2',
        contenido: 'Hola soy tu Asistente',
        tipo: 'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u2',
      }, {
        id: 'id2',
        contenido: 'La necesito alas 3:40',
        tipo: 'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u2',
      }, {
        id: 'id1',
        contenido: 'Hola soy tu Asistente',
        tipo: 'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Error',
        usuarioId: 'u2',
      }, {
        id: 'id2',
        contenido: 'Necesito esta cita para mañana ',
        tipo: 'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u1',
      }, {
        id: 'id1',
        contenido: 'Necesito esta cita para mañana ',
        tipo: 'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u1',
      }, {
        id: 'id2',
        contenido: 'Necesito esta cita para mañana ',
        tipo: 'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u1',
      },
    ]
  }
}
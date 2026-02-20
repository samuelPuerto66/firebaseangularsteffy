import { Component } from '@angular/core';
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
  asistenteEscribiendo=false
  mensajeTexto=""
  enviandoMensaje=false
  enviarMensaje(){
  }
  formatearMensajeAsistente(mensaje: string) {

  }
  mensajes: MensajeChat[] = []
  cargandoHistorial = false

  trackByMensaje(index: number, mensaje: MensajeChat) {
  }
  ManejoErrorImagen() {
  }
  cerrarsesion() {
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
      },{
         id: 'id2',
        contenido: 'Hola soy tu Asistente',
        tipo: 'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u2',
      },{
         id: 'id2',
        contenido: 'La necesito alas 3:40',
        tipo: 'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Enviado',
        usuarioId: 'u2',
      },{
         id: 'id2',
        contenido: 'Hola soy tu Asistente',
        tipo: 'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado: 'Error',
        usuarioId: 'u2',
      }
    ]
  }
}
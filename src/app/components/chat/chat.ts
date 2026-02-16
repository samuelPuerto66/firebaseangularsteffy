import { Component } from '@angular/core';
import { MensajeChat } from '../../../models/chat';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  nombre:string="Samuel Puerto M."
  email:string="samuelpuerto066@gmail.com"

  mensajes: MensajeChat[] =[]
  cargandoHistorial= 1
  ManejoErrorImagen(){
    }
    cerrarsesion(){
    }
  }


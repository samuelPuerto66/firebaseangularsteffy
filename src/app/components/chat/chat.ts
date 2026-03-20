import { Component, ViewChild, ElementRef, inject, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MensajeChat } from '../../../models/chat';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {


  private authService = inject(AuthService)
  private chatService = inject(ChatService)
  private router = inject(Router)

  //Referenciar contenedores
  @ViewChild('messagesContainer') messagesContainer! : ElementRef
  @ViewChild('mensajeInput') mensajeInput! : ElementRef

  usuario: User|null = null;
  mensajes: MensajeChat[] =[]
  cargandoHistorial=false
  asistenteEscribiendo=false
  enviandoMensaje=false
  mensajeTexto=""
  mensajetextoError=""
  mensajeerror=""
  private debeHacerScroll: boolean = false;

  private suscripciones : Subscription[] = []

  private async verificarAutenticacion(): Promise<void>{
  // a la variable usuario le voy a asignar el servicio de auth y la funcion obtenerUsuario
  this.usuario = this.authService.obtenerUsuario()
  if (!this.usuario) {
    await this.router.navigate(['/auth'])
    throw Error('No hay un usuario autenticado')
  }
}
private async inicializarChat(): Promise<void>{
  if(!this.usuario){
    return; 
  }
this.cargandoHistorial = true;
try{
  await this.chatService.InicializarChat(this.usuario.uid)
} catch (error){
  console.error('Error al inicializar')
  throw error;

  
}finally{
  this.cargandoHistorial = false
}
}

  private configurarSuscripciones(): void{
    const subMensajes = this.chatService.mensajes$.subscribe( mensajes=>{
      this.mensajes = mensajes; 
      this.debeHacerScroll = true;
    });

    
    const subMensajesAsis = this.chatService.asistenteRespondiendo$.subscribe( respondiendo => {
      this.asistenteEscribiendo = respondiendo;
      if(respondiendo){
        this.debeHacerScroll = true
      }
    });


    this.suscripciones.push(subMensajes, subMensajesAsis)
  }


 async  enviarMensaje(): Promise<void>{
  if(!this.mensajeTexto.trim()){
    return;
  }

  this.mensajeerror=""
  this.enviandoMensaje= true;

//guardar el mensaje en la variable texto 
  const texto = this.mensajeTexto.trim();
  //limpiar el input
  this.mensajeTexto= "";

  try{
    await this.chatService.enviarMensaje(texto);
    this.enfocarInput();
  }catch(error: any){
    console.error('Error al enviar el mensaje')

    this.mensajeerror = error.message  || 'Error al enviar el mensaje'
    this.mensajeTexto = texto;
  }finally{
    this.enviandoMensaje = false;
  }

}

  manejarTeclaPresionada(evento: KeyboardEvent){
    if(evento.key === "Enter" && !evento.shiftKey){
      evento.preventDefault();
      this.enviarMensaje();
    }
  }

  
    
   

  async cerrarSesion(): Promise<void>{
    try{
      this.chatService.limpiarChat();

      await this.authService.cerrarSesion();
      await this.router.navigate(['/auth']);
    }catch (error){
      console.error('Error al cerrar la sesion desde el componente')
      this.mensajeerror = "Error al cerrar la sesion"
    }
  }

  

  


  private scrollHaciaAbajo():void{
    try{
        const container = this.messagesContainer?.nativeElement
        if(container){
          container.scrollTop = container.scrollHeight
          
        }
    }catch(error){
      console.error('✖️Error al hacer scroll', error)

    }
  }
  ngAfterViewChecked():void{
    if(this.debeHacerScroll){
      this.scrollHaciaAbajo();
      this.debeHacerScroll=false
    }

  }




   manejoErrorimagen(evento: any ): void {
    evento.target.src =""

  }
  

  trackByMensaje(index:number, mensaje: MensajeChat){
    if (mensaje.id) return mensaje.id;
    return `${mensaje.tipo} - ${mensaje.fechaEnvio.getTime()}`;
  }

  formatearMensajeAsistente(contenido:string){
    
    return contenido
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }


  formatearHora(fecha: Date): string{
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })

  }

 async ngOnInit(): Promise <void>{

  try {
    await this.verificarAutenticacion();
    if (!this.usuario) {
      return;
    }
    await this.inicializarChat();
    this.configurarSuscripciones();

  } catch (error) {
    console.error('Error al inicializar el chat OnInit')
    this.mensajeerror= "Error al cargar el chat. Intente recargar la pagina"
  }
 }

 ngOnDestroy():void{
  this.suscripciones.forEach(sub => sub.unsubscribe());
}


 private enfocarInput(): void{
  setTimeout(() =>{
    this.mensajeInput.nativeElement.focus();

  }, 100);

}
}
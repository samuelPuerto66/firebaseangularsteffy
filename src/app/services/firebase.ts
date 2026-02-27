import { Injectable, inject } from '@angular/core';
import { Firestore,Timestamp, collection, addDoc } from '@angular/fire/firestore';
import { MensajeChat  } from '../../models/chat';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firestore = inject(Firestore)
//funcion para guardar elmensaje.
async guardarMensaje(mensaje: MensajeChat): Promise<void>{
  try{
    //revisar si viene sin usuarioId
    if(mensaje.usuarioId){
      //devulvo que el mensaje debe tener un usuario id 
      throw new Error ('usuario id es requerido');
    }else if(!mensaje.contenido){
      throw new Error ('el contenido es requerido');
    }else if (!mensaje.tipo){
      throw new Error ('El tipo es requerido')
    }

    const coleccionMensajes = collection(this.firestore,'Mensajes')
    //prepara el mensaje respecto a las fechas
    const mensajeGuardar={
      usuarioId : mensaje.usuarioId,
      contenido :mensaje.contenido,
      tipo: mensaje.tipo,
      estado: mensaje.estado,
      // fecha tipo timestap 
      fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
    };
    //añadir un documento a la coleccion, generar en coleccion
    const docRef =await addDoc(coleccionMensajes,mensajeGuardar)
  } catch(error:any){
      console.error('☣️ error alguardar mensaje')
      console.error('error details',{
        mensaje : error.mensaje,
        code: error.code,
        stack:error.stack

      })

    }
  }
  obtenerMensajesUsuario(userId: int): Observable${
    //filtrar que los mensajes que se muestran sean los mensajes del usuario autenticado
    

  }

}

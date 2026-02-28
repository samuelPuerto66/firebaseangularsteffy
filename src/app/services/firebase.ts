import { Injectable, Query, inject } from '@angular/core';
import { Firestore, Timestamp, collection, addDoc,
  query, where, onSnapshot,
  QuerySnapshot, DocumentData } from '@angular/fire/firestore';

import { ConversacionChat, MensajeChat } from '../../models/chat';
import { Observable } from 'rxjs';
import { reportUnhandledError } from 'rxjs/internal/util/reportUnhandledError';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firestore = inject(Firestore);
  //funcion para guardar elmensaje.
  async guardarMensaje(mensaje: MensajeChat): Promise<void> {
    try {
      //revisar si viene sin usuarioId
      if (mensaje.usuarioId) {
        //devulvo que el mensaje debe tener un usuario id
        throw new Error('usuario id es requerido');
      } else if (!mensaje.contenido) {
        throw new Error('el contenido es requerido');
      } else if (!mensaje.tipo) {
        throw new Error('El tipo es requerido');
      }

      const coleccionMensajes = collection(this.firestore, 'Mensajes');
      //prepara el mensaje respecto a las fechas
      const mensajeGuardar = {
        usuarioId: mensaje.usuarioId,
        contenido: mensaje.contenido,
        tipo: mensaje.tipo,
        estado: mensaje.estado,
        // fecha tipo timestap
        fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio),
      };
      //añadir un documento a la coleccion, generar en coleccion
      const docRef = await addDoc(coleccionMensajes, mensajeGuardar);
    } catch (error: any) {
      console.error('✖️ error al guardar mensaje');
      console.error('error details', {
        mensaje: error.mensaje,
        code: error.code,
        stack: error.stack,
      });
    }
  }
  //filtrar que los mensajes que se muestran sean los mensajes del usuario autenticado
  obtenerMensajesUsuario(usuarioId: String): Observable<MensajeChat[]> {
    {
      return new Observable(observer => {

        const consulta = query(
          collection(this.firestore, 'Mensajes'),
          where('usuarioId', '==', usuarioId),
        )

        //configurar el listener para que funcione en tiempo real snapshot
         const unsubscribe = onSnapshot(
          consulta,
            (snapshot: QuerySnapshot<DocumentData>) => {
            const mensajes: MensajeChat[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id : doc.id,
                usuarioId: data['usuarioId'],
                contenido: data['contenido'],
                estado: data['estado'],
                tipo: data['tipo'],
                //recordamos que firebase guarda timestamp, por lo que hay que convertirlo a date
                fechaEnvio : data['fechaEnvio'].toDate(),

              } as MensajeChat;

            });
            //ordenar los mensajes por fecha de envio
            mensajes.sort((a, b) => a.fechaEnvio.getTime() - b.fechaEnvio.getTime());
            observer.next(mensajes);
          },
          error => {
            console.error('✖️ error al obtener mensajes en tiempo real');
            observer.error(error);
          }
         );
         //se retorna una des suscripcion al servicio
         return () => {
          unsubscribe;
        }
        });




    }

  }

  //guardar la conversacion
  async guardarConversacion(conversacion: ConversacionChat ): Promise<void> {
    try {
      const collectionConversaciones = collection(this .firestore,'Conversaciones');
      //preparar la conversacion para enviar y guardar en firebase
      const conversacionGuardar = {
        ...conversacion,
        fechaCreacion: Timestamp.fromDate(conversacion.fechaCreacion),
        ultimaActividad: Timestamp.fromDate(conversacion.ultimaActividad),

        //conversion de la fechaenvio del mensaje chat
        mensajes: conversacion.mensajes.map ( mensaje => ({
          ...mensaje,
          FechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
        }))
      };

      await addDoc(collectionConversaciones, conversacionGuardar);

    }catch (error: any) {
      console.error('✖️ error al guardar conversacion', error);
      throw Error;
  }
}
}

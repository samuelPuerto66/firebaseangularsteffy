import { inject, Injectable } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { map } from 'rxjs';
import { Usuario } from '../../models/usuario';
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';
import { object } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'})
export class AuthService {

  private auth = inject(Auth)

  //variable de tipo observable
  usuarios$ = user(this.auth)

  // variable que devuelve true si el ususario esta autenticado
  estaAutenticado$ = this.usuarios$.pipe(
    map(usuario => !!usuario)
  )




  // funcion asincrona que permite el inicio de sesion 
  async iniciarSesion(): Promise<Usuario | null> {
    try {

      const proveedor = new GoogleAuthProvider;
      //controladores
      proveedor.addScope('email')
      proveedor.addScope('profile')

      console.log("antes")
      const resultado = await signInWithPopup(this.auth, proveedor)
      console.log("despues")

      const usuarioFirebase = resultado.user;



      if (usuarioFirebase) {
        const usuario: Usuario = {

          uid: usuarioFirebase.uid,
          nombre: usuarioFirebase.displayName || 'Usuario sin Nombre',
          email: usuarioFirebase.email || '',
          fotoUrl: usuarioFirebase.photoURL || undefined,
          fechaCreacion: new Date,
          ultimaConexion: new Date

        }
        return usuario;
      }
      return null;
    } catch (error) {
      console.error('❌ error en la autenticacion')
      throw error
    }
  }

  obtenerUsuario(): User | null {
    return this.auth.currentUser
  }
  //cerrar sesion
}


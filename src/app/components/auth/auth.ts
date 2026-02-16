import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
MensajeError="."
Autenticando=false

//inject de dependencias

private authservice = inject(AuthService)
private router = inject(Router)


//funcion que revise la autenticacion = asincrona

async IniciarSesionConGoogle (): Promise <void>{
  this.Autenticando = true
  this.MensajeError = ""

   try {
    //falta implementar el servicio






    //vamos a simular un usuario ya creado
    let usuarios=null
    usuarios = await new Promise ((resolve) =>{
      setTimeout(()=>resolve({nombre:'usuario de prueba'}),1000)
  })
  if (usuarios){
    await this.router.navigate(['/chat'])
  } else{
    this.MensajeError = " Hubo un error al Autenticar "
    console.error(" Error al autentivar con try ")
  }
  } catch (error: any){
    
    //validacion de algunos posibles errores
    if(error.code === "auth/popup-closed-by-user"){
      console.error('Error: Cerraste la ventana emergente')
    } else if (error.code =="auth/popup-blocked"){
      console.error('El navegador bloqueo la ventana emergente')
    }else if (error.code =='auth/network-request-failed'){
      console.error('Problemas con la conexion a internet')
    }

   }finally{
    this.Autenticando = false
   


   }
   
  }
  
}

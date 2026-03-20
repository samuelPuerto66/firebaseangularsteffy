import { inject, Injectable } from '@angular/core';
import { AuthService } from './../services/auth';
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap} from 'rxjs/operators'
@Injectable({
  providedIn: 'root',
})
export class  authGuard implements CanActivate  {

  private AuthService = inject(AuthService);
  private router = inject(Router) 

  canActivate(): Observable<boolean> {
    return this.AuthService.estaAutenticado$.pipe(
      tap( estaAutenticado =>{
        if(!estaAutenticado){
          console.log("Error acceso denegado")
          this.router.navigate(['/auth'])
        }else{
          console.log("Accedo concedido")
        }
      }
    ),
    map(estaAutenticado => estaAutenticado)
    

    );
      
  }
};
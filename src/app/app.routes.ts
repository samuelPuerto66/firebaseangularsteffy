import { Routes } from '@angular/router';
import { AuthGuard } from '@angular/fire/auth-guard';
import { authGuard } from './guard/auth-guard';
export const routes: Routes = [
    {
        path:'',
        redirectTo:'/auth',
        pathMatch: 'full'
    },{
        path:'auth',
        loadComponent:() => import ('./components/auth/auth').then(m => m.Auth),
        title: "Inicio de Sesion"
    },{
        path:'chat',
         loadComponent:() => import ('./components/chat/chat').then(m => m.Chat),
         title: "Chat con tu agente IA",
         canActivate: [authGuard]
    },{
        path:"**",
        redirectTo:"/auth"
    }
];

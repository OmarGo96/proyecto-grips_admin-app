import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'landing',
    loadChildren: () => import('./modules/landing/landing.module').then( m => m.LandingPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'otp',
    loadChildren: () => import('./modules/recovery-account/recovery-account.module').then( m => m.RecoveryAccountPageModule)
  },
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'operador',
        loadChildren: () => import('./modules/operador-tabs/operador-tabs.module').then( m => m.OperadorTabsPageModule)
      },
      {
        path: 'notificaciones',
        loadChildren: () => import('./modules/notificaciones/notificaciones.module').then( m => m.NotificacionesPageModule)
      },
      {
        path: 'operators/cms_pre_solicitudes',
        loadChildren: () => import('./modules/pre-solicitud/pre-solicitud.module').then(m => m.PreSolicitudPageModule)
      },
      {
        path: 'solicitud',
        loadChildren: () => import('./modules/solicitud/solicitud.module').then( m => m.SolicitudPageModule)
      }
    ]
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServiciosPage } from './servicios.page';
import {DetalladoComponent} from "./detallado/detallado.component";

const routes: Routes = [
  {
    path: '',
    component: ServiciosPage
  },
  {
    path: ':idservicio',
    component: DetalladoComponent
  },
  {
    path: '',
    redirectTo: '/operador/servicios',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServiciosPageRoutingModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AsistenciasTabPage } from './asistencias-tab.page';



const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AsistenciasTabPage
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AsistenciasTabPageRoutingModule {}

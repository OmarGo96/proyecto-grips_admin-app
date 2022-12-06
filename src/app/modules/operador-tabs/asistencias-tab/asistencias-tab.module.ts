import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AsistenciasTabPageRoutingModule } from './asistencias-tab-routing.module';

import { AsistenciasTabPage } from './asistencias-tab.page';
import { AppCommonModule } from '../../../common/common.module';
import { MaterialModule } from '../../../material/material.module';
import { RouterModule } from '@angular/router';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AsistenciasTabPageRoutingModule,
    AppCommonModule,
    ReactiveFormsModule,
    MaterialModule,
    RouterModule
  ],
  declarations: [
    AsistenciasTabPage
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true }
    }
  ]
})
export class AsistenciasTabPageModule {}

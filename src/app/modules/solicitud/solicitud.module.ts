import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SolicitudPageRoutingModule } from './solicitud-routing.module';

import { SolicitudPage } from './solicitud.page';
import {AppCommonModule} from '../../common/common.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        SolicitudPageRoutingModule,
        AppCommonModule
    ],
  declarations: [SolicitudPage]
})
export class SolicitudPageModule {}

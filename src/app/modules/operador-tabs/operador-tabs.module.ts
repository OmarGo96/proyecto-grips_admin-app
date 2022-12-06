import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OperadorTabsPageRoutingModule } from './operador-tabs-routing.module';

import { OperadorTabsPage } from './operador-tabs.page';
import { AppCommonModule } from '../../common/common.module';
import {GoogleMapsComponent} from '../../common/google-maps/google-maps.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OperadorTabsPageRoutingModule,
    AppCommonModule
  ],
  providers: [
    GoogleMapsComponent
  ],
  declarations: [
    OperadorTabsPage
  ]
})
export class OperadorTabsPageModule {}

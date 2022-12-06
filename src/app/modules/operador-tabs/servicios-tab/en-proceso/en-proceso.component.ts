import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Solicitud } from '../../../../interfaces/solicitud';
import { GeneralService } from '../../../../services/general.service';
import { SessionService } from '../../../../services/session.service';
import { SweetMessagesService } from '../../../../services/sweet-messages.service';

@Component({
  selector: 'app-en-proceso',
  templateUrl: './en-proceso.component.html',
  styleUrls: ['./en-proceso.component.scss'],
})
export class EnProcesoComponent implements OnInit, OnChanges {

  @Input() solicitudes: Solicitud[];

  constructor(
    public modalCtr: ModalController,
    public generalServ: GeneralService,
    public sessionServ: SessionService,
    public sweetMsg: SweetMessagesService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    let solicitudChange = changes.solicitudes;
    if (solicitudChange.firstChange === false || solicitudChange.isFirstChange() === true) {
      if (this.solicitudes) {

      }
    }
  }
}

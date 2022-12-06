import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NotificationI } from '../../../interfaces/notifications/notification.interface';
import { SweetMessagesService } from '../../../services/sweet-messages.service';
import {PushNotificationsService} from '../../../services/push-notifications.service';
import {PreSolStatusE} from "../../../enums/pre-sol-status.enum";
import {GeneralService} from "../../../services/general.service";
import {AsistenciasService} from "../../../services/asistencias.service";
import {GeoService} from "../../../services/geo.service";
import {DateConv} from "../../../helpers/date-conv";

@Component({
  selector: 'app-view-notification',
  templateUrl: './view-notification.component.html',
  styleUrls: ['./view-notification.component.scss'],
})
export class ViewNotificationComponent implements OnInit {

  @Output() emitReloadNoti = new EventEmitter();
  @Input() notification: NotificationI;

  public preSolStatusE = PreSolStatusE;
  public dateConv = DateConv;

  constructor(
    public modalCtrl: ModalController,
    public notiServ: PushNotificationsService,
    public sweetServ: SweetMessagesService,
    public generalServ: GeneralService,
    private asistenciasService: AsistenciasService,
    public geoServ: GeoService
    ) {}

  ngOnInit() {}

  putNotiRead(idnoty, justMark?: boolean) {
    let data = {
      id: idnoty
    }
    this.notiServ.notificationAsRead(data).subscribe(res => {
      if (res.ok === true) {
        if (!justMark) {
          this.dismiss(true);
        }
      }
    }, error => {
      console.log(error);
      this.sweetServ.printStatusArray(error.error.errors, 'error');
    });
  }

  async attendService(){
    this.sweetServ.confirmRequest('¿Estás seguro de atender este servicio?').then(async (value) => {
      if (value.value) {
        let coord = await this.geoServ.getCurrentCoords();
        let lat;
        let long;
        if (coord.ok !== true) {
          console.log('Error during obtaing location -->', coord);
        } else {
          lat = coord.lat;
          long = coord.lon;
        }
        const payload = {
          pre_sol_id: (this.notification.pre_sol && this.notification.pre_sol.id) ? this.notification.pre_sol.id : this.notification.model_id,
          partner_id: this.notification.pre_sol.partner_id,
          lat: lat,
          lon: long
        };
        this.generalServ.presentLoading('Enviado información ...');
        try {
          const query: any = await this.asistenciasService.attendPreSolicitudes(payload);
          if (query && query.ok) {
            this.generalServ.dismissLoading();
            this.sweetServ.printStatus(query.message, 'success');
            // TODO: devolver a la sección mis-solicitudes
            location.reload();
          }
        } catch (e) {
          this.generalServ.dismissLoading();
          console.log(e);
          this.sweetServ.printStatusArray(e.error.errors, 'error');
        }
      }
    });
  }

  dismiss(needRealod: boolean) {
    this.modalCtrl.dismiss({
      reload: needRealod
    });
  }
}

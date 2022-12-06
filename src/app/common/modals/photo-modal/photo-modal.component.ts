import {Component, Input, OnInit} from '@angular/core';
import {GeneralService} from '../../../services/general.service';
import {PreSolicitudesService} from '../../../services/pre-solicitudes.service';
import {ModalController} from '@ionic/angular';
import {SweetMessagesService} from '../../../services/sweet-messages.service';

@Component({
  selector: 'app-photo-modal',
  templateUrl: './photo-modal.component.html',
  styleUrls: ['./photo-modal.component.scss'],
})
export class PhotoModalComponent implements OnInit {
  @Input() data: any;
  public DocVehiculo = [];

  constructor(public generalServ: GeneralService,
              private preSolServ: PreSolicitudesService,
              public viewCtrl: ModalController,
              public sweetMsg: SweetMessagesService,
              public modalCtrl: ModalController ) { }

  ngOnInit() {
    console.log('init', this.data);
  }

  async capturedPhoto(e, type: string) {
    const payload = {
      solicitud_id: this.data.solicitud_id,
      section: this.data.section,
      pictures: [e]
    };

    if (type === 'DocVehiculo') {
      payload.section = 'doctsveh';
      const q: any = await this.uploadPic(payload);
      await this.generalServ.dismissLoading();
      if (q.ok) {
        this.DocVehiculo.push({ image: e, id: q.data[0].attachment_id });
      }
    }
  }


  async uploadPic(payload: any) {
    await this.generalServ.presentLoading('Subiendo fotografía');
    const query: any = await this.preSolServ.uploadPicture(payload);
    await this.generalServ.dismissLoading();
    if (query.ok) {
      this.generalServ.sweetAlert('Guardado correctamente', 'success');
      // await this.close({ok: true, data: query.data});
      return {ok: true, data: query.data};
    }else {
      this.generalServ.sweetAlert('Error al guardar', 'warning');
      return {ok: false};
    }
  }

  async close(data) {
    if (this.DocVehiculo.length > 0) {
      await this.viewCtrl.dismiss({ ok: true } );
    } else {
      await this.viewCtrl.dismiss({ ok: false } );
    }
  }

  deletePhoto(i, type: string, attachment) {

    this.sweetMsg.confirmRequest('¿Estás seguro de querer adjuntar este archivo?').then(async (data) => {
      const payload = {
        solicitud_id: this.data.solicitud_id,
        section: type,
        attachment_id: attachment
      };

      if (data.isConfirmed) {
        await this.unlinkPicture(i, type, payload);
      }else{
        console.log('Rechazó la eliminación');
      }
    });
  }

  async unlinkPicture(i, type, payload) {

    await this.generalServ.presentLoading('Eliminando...');
    const query = await this.preSolServ.deletePartnerDocs(payload);
    this.generalServ.dismissLoading();

    if (query.ok) {
      this.sweetMsg.printStatus('Eliminado correctamente', 'success');
      if (type === 'doctsveh') {
        document.getElementById(`DocVehiculo_${i}`).remove();
        this.DocVehiculo.splice(i, 1);
      }
    }
  }

}

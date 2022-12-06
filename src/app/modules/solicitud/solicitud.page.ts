import { Component, OnInit } from '@angular/core';
import {PreSolicitudI} from '../../interfaces/pre-solicitud/pre-solicitud.interface';
import {ActivatedRoute} from '@angular/router';
import {PreSolicitudesService} from '../../services/pre-solicitudes.service';
import {GeneralService} from '../../services/general.service';
import {StorageService } from '../../services/storage.service';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-solicitud',
  templateUrl: './solicitud.page.html',
  styleUrls: ['./solicitud.page.scss'],
})
export class SolicitudPage implements OnInit {

  public preSolId: number;
  public preSolData: PreSolicitudI;
  constructor(
    private route: ActivatedRoute,
    public preSolicitudesServ: PreSolicitudesService,
    public generalServ: GeneralService,
    private storage: StorageService,
    public navCtrl: NavController
  ) { }

  ngOnInit() {
  }

  async ionViewDidEnter() {
    this.route.params.subscribe(params => {
      console.log('incoming data', params);
      if (params.preSolId) {
        this.preSolId = params.preSolId;
      }
    });
    const sol = await this.storage.get('preSol');
    if (sol){
      this.preSolId = sol.id;
      const payload = {
        seccion: 'detallado',
        solicitud_id: this.preSolId
      };
      this.loadPreSolData(payload);
    } else {
      await this.navCtrl.navigateRoot('/operador/servicios');
    }
    console.log('enter view servicio detallado', sol);
  }

  public loadPreSolData(payload: {}) {
    this.generalServ.presentLoading();
    this.preSolicitudesServ.getSolicitud(payload).subscribe(res => {
      console.log('response from server ', res);
      if (res.ok === true) {
        this.preSolData = res.solicitudes;
        this.generalServ.dismissLoading();
      }
    }, error => {
      this.generalServ.dismissLoading();
      console.log(error);
    });

  }

}

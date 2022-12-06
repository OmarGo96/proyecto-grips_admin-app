import {Component} from '@angular/core';
import {ModalController, NavController} from '@ionic/angular';
import {MapPin} from '../../../interfaces/map-pin';
import { ServiceDetailsComponent } from '../../../common/components/service-details/service-details.component';
import {Subject} from 'rxjs';
import {GeoService} from '../../../services/geo.service';
import {SweetMessagesService} from '../../../services/sweet-messages.service';
import {SessionService} from '../../../services/session.service';
import {takeUntil} from 'rxjs/operators';
import {GeneralService} from '../../../services/general.service';

@Component({
  selector: 'app-asistencias-tab',
  templateUrl: './asistencias-tab.page.html',
  styleUrls: ['./asistencias-tab.page.scss'],
})
export class AsistenciasTabPage {
  mapSubject: Subject<void> = new Subject<void>();
  reloadMapSubject: Subject<any> = new Subject<any>();
  createMapSubject: Subject<any> = new Subject<any>();
  resetMap: Subject<any> = new Subject<any>();
  leaveView: Subject<boolean> = new Subject<boolean>();
  public isInService = false;
  public pinsOnMap: MapPin[] = [];
  public loadMap = true;
  public latitude: number;
  public longitude: number;
  public detailsVisible = false;
  public modalObject: any;

  showMap: boolean;
  firstLoad: boolean;

  constructor(
    public navigate: NavController,
    public modalCtr: ModalController,
    public geoServ: GeoService,
    public sweetMsgServ: SweetMessagesService,
    public sessionServ: SessionService,
    public generalServ: GeneralService
  ) {
  }

  async ionViewWillEnter() {
    this.leaveView = new Subject<boolean>();
    await this.checkDBIsOnService();
    this.sessionServ.isOnService$.pipe(takeUntil(this.leaveView)).subscribe(res => {
      setTimeout(() => {
        console.log('isOnService$ --->', res);
        this.isInService = res;
        this.showMap = res;
        if (this.isInService) {
          if (!this.firstLoad) {
            this.createMapSubject.next();
          } else {
            this.reloadMap();
          }
        }
        this.firstLoad = true;
      }, 200);
    });
  }

  async checkDBIsOnService() {
    this.generalServ.loadNgxSpinner('Cargando disponibilidad', 'maps');
    this.sessionServ.checkOnServiceDB = true;

    try {
      let res = await this.sessionServ.isOnService().toPromise();
      this.generalServ.hideNgxSpinner();
      if (res.ok) {
        this.sessionServ.setIsInService(res.data.available);
      }
    } catch (e) {
      this.sessionServ.checkOnServiceDB = false;
      this.generalServ.hideNgxSpinner();
      console.log(e);
      this.sessionServ.setIsInService(false);
    }
  }

  ionViewDidLeave(){
    console.log('Leave asistencias');
    this.resetMap.next();
    this.leaveView.next(true);
  }

  traceRouteMaps(data) {
    this.mapSubject.next(data);
  }

  async reloadMap() {
    this.reloadMapSubject.next();
  }

  async serviceDetailListeners(detailsData) {
    this.modalObject = await this.openServiceModal(detailsData);
    console.log('Modal object loaded', this.modalObject);
  }

  async openServiceModal(detailsData) {
    console.log('Listening for incoming service and status is: ', this.detailsVisible);
    console.log(detailsData);
    const modal = await this.modalCtr.create({
      component: ServiceDetailsComponent,
      swipeToClose: true,
      componentProps: {
        asModal: true,
        data: detailsData
      }
    });
    await modal.present();
    const {data} = await modal.onWillDismiss();
    if (data && data.data){
     await this.reloadMap();
    }
  }

  navigateTo(param: 'cotizar' | 'programar' | 'solicitar') {
    this.navigate.navigateRoot([`/operador/asistencias/solicitar/${param}`]);
  }

  async saveInService(available: boolean) {
    if (available !== this.sessionServ.isOnService$.value) {
      try {
        const res = await this.geoServ.saveGeoPosition(available, false);
        if (res) {
          this.generalServ.hideNgxSpinner();
          this.sweetMsgServ.printStatus('Disponibilidad guardada satisfactoriamente', 'success');
          this.sessionServ.setIsInService(available);
        }
      } catch (e) {
        console.log(e);
        this.sweetMsgServ.printStatus('Algo salio mal al momento de actualizar su estado', 'warning');
      }
    }

  }
}

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {LoadingController} from '@ionic/angular';
import {BehaviorSubject} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {ConfigParams} from '../interfaces/config/config-params';
import {PreSolStatusE} from "../enums/pre-sol-status.enum";
import {SweetMessagesService} from "./sweet-messages.service";
import {SolicitudesStatus} from "../enums/solicitudes-status.enum";
import {NgxSpinnerService} from 'ngx-spinner';
import {Network} from '@capacitor/network';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  //#region Atributos
  public apiUrl = environment.API_URL;
  public configParams: ConfigParams[];
  public availableFleets: number;
  public verifyEmail$ = new BehaviorSubject(null);

  public ngxLoaderMsg: string;
  public netWorkStatus$ = new BehaviorSubject<boolean>(null);
  //#endregion

  constructor(
    public loadingController: LoadingController,
    public httpClient: HttpClient,
    public router: Router,
    public sweetServ: SweetMessagesService,
    public spinner: NgxSpinnerService,
    ) {}

  async presentLoading(message?) {
    const loading = await this.loadingController.create({
      cssClass: 'loading-controller',
      message: (message) ? message : 'Cargando datos ...',
      duration: 60000
    });
    await loading.present();
  }

  dismissLoading() {
    setTimeout(() => {
      this.loadingController.dismiss();
    }, 300);
  }

  // Función para cargar el loader spinner del stepper
  async loadNgxSpinner(message, source?: 'maps', id?: string) {
    let type = 'square-jelly-box';
    switch (source) {
      case 'maps':
        type = 'ball-scale-multiple';
        break;
    }
    this.ngxLoaderMsg = message;
    await this.spinner.show(id ? id : 'loaderNgx', {
      bdColor: 'rgb(75 75 75 / 57%)',
      color: '#f5f5f5',
      type,
      fullScreen: true,
      size: 'default',
      zIndex: 99999,
    });
  }

  // Función para ocultar el loader spinner del stepper
  async hideNgxSpinner(id?) {
    this.ngxLoaderMsg = null;
    await this.spinner.hide(id ? id : 'loaderNgx');
  }

  initConfigParams() {
    this.loadConfigParams().subscribe(res => {
      if (res.ok === true) {
        this.configParams = res.config_params;
      }
    }, error => {
      console.log(error);
    })
  }

  public checkAvailableFleets(): Observable<number> {
    return this.httpClient.get<any>(`${this.apiUrl}/config/available/fleets`).pipe(map(response => {
      return response.total_available;
    }));
  }

  public loadValidateQuestions(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/config/validate-questions`).pipe(map(response => {
      return response;
    }));
  }

  private loadConfigParams(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/config/params`).pipe(map(response => {
      return response;
    }));
  }

  public static getServStatusString(status) {
    switch (status) {
      case 'reserved':
        return 'RESERVADA';
      case 'draft':
        return 'BORRADOR';
      case 'arrived':
        return 'ARRIBADA';
      case 'open':
        return 'ABIERTA';
      case 'paid':
        return 'PAGADA';
      case 'paidlocked':
        return 'VALIDANDO PAGO';
      case 'paidvalid':
        return 'PAGO VALIDADO';
      case 'locked':
        return 'ENCIERRO';
      case 'cancel':
        return 'CANCELADA';
      case 'closed':
        return 'CERRADA';
      case 'invoiced':
        return 'FACTURADA';
      case 'receivable':
        return 'CUENTA X COBRAR';
      case 'relased':
        return 'LIBERADA';
      case 'call_request':
        return  'SOLICITUD DE LLAMADA';
      case 'quot_request':
        return  'SOLICITUD DE COTIZACIÓN';
      case 'on_transit':
        return 'OPERADOR EN TRANSITO';
      default:
        return 'EN PROCESO';
    }
  }

  canShowTimeCounter( data): boolean {
    switch (data.model) {
      case 'cms_pre_solicitudes':
        const visibleStatus = [PreSolStatusE.NUEVA, PreSolStatusE.SIENDOATENDIA, PreSolStatusE.CONFIRMADAACEPTADA];
        return visibleStatus.some(x => x === data.status);
        break;
      default:
        return false;
    }
  }

  canShowBtnAction(action: 'accept-service' | 'cancel-service', model, data) {
    switch (model) {
      case 'cms_pre_solicitudes':
        switch (action) {
          case 'accept-service':
            let acceptValidSts = [PreSolStatusE.NUEVA];
            return acceptValidSts.some(x => x === data.status);
            break;
          case 'cancel-service':
            let cancelValidSts = [PreSolStatusE.NUEVA, PreSolStatusE.SIENDOATENDIA, PreSolStatusE.CONFIRMADAACEPTADA];
            return cancelValidSts.some(x => x === data.status);
            break;
        }
        break;
    }
    return false;
  }

  canShowAccordeon(accordName: 'datos-servicio' | 'preguntas' | 'datos-vehiculo' | 'cobro' | 'arribo' | 'firma', model: 'cms_pre_solicitudes' | 'cms_padsolicitudes' | string, data ) {
    switch (accordName) {
      case 'datos-servicio':
      case 'preguntas':
      case 'datos-vehiculo':
        return true;
        break;
      case 'cobro':
        if (data.complementData.cotizacion && data.complementData.cotizacion.items && data.complementData.cotizacion.items.length > 0) {
          return true;
        } else {
          return false;
        }
        break;
      case 'arribo':
        if (model === 'cms_padsolicitudes') {
          if (data.status === SolicitudesStatus.ARRIBADA || data.status === SolicitudesStatus.ABIERTA) {
            return true;
          } else {
            return false;
          }
        }
        break;
      case 'firma':
        if (model === 'cms_padsolicitudes') {
          if (data.status === SolicitudesStatus.ARRIBADA || data.status === SolicitudesStatus.ONTRANSIT || data.status === SolicitudesStatus.ABIERTA) {
            return true;
          } else {
            return false;
          }
        }
        break;
    }
    return false;
  }

  sweetAlert(action: string, status: string){
    this.sweetServ.printStatus(action, status);
  }

  checkNetworkStatus() {
    Network.addListener('networkStatusChange', status => {
      this.netWorkStatus$.next(status.connected);
      console.log('network status -->', status);
    });
  }

  acceptService() {
    console.log('accion');
    this.sweetServ.printStatus('Acción en desarrollo', 'warning');
    return;
  }

  cancelService() {
    console.log('cancel service');
    // TODO: Falta definir flujo de cancelación
    this.sweetServ.printStatus('Acción en desarrollo, falta definir flujo de cancelación', 'warning');
    return;
  }
}

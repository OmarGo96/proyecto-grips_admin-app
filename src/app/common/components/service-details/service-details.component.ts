import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ModalController, NavController} from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { AsistenciasService } from '../../../services/asistencias.service';
import {SweetMessagesService} from '../../../services/sweet-messages.service';
import {PreSolicitudI} from '../../../interfaces/pre-solicitud/pre-solicitud.interface';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {PreSolicitudesService} from '../../../services/pre-solicitudes.service';
import {Location} from '@angular/common';
import {GeneralService} from '../../../services/general.service';
import {GeoService} from '../../../services/geo.service';
import {DateConv} from '../../../helpers/date-conv';
import {DocsViewerComponent} from '../../docs-viewer/docs-viewer.component';
import {ToastMessageService } from '../../../services/toast-message.service';

@Component({
  selector: 'app-service-details',
  templateUrl: './service-details.component.html',
  styleUrls: ['./service-details.component.scss'],
})
export class ServiceDetailsComponent implements OnInit, OnChanges {
  @Input() asModal: boolean;
  @Input() data: PreSolicitudI;
  public photoVehiculoURL: SafeResourceUrl;
  dateHelper = DateConv;
  loadingPhotoVehiculo = false;
  public canSign = false;
  step = 0;
  public signature = null;
  public files = [];
  public DocVehiculo = [];
  public DocCliente = [];
  public ladoFrente = [];
  public ladoTrasero = [];
  public ladoChofer = [];
  public ladoCopiloto = [];
  public loadingInit = false;
  public photoSides = ['doctsveh', 'doctscliente', 'front', 'rear', 'side_a', 'side_b'];

  public indexTabGroup: number;

  constructor(
    public modalCtrl: ModalController,
    public alertController: AlertController,
    private service: AsistenciasService,
    public sweetMsg: SweetMessagesService,
    private sanitizer: DomSanitizer,
    private preSolServ: PreSolicitudesService,
    private location: Location,
    public generalServ: GeneralService,
    public geoServ: GeoService,
    public toast: ToastMessageService,
    public navCtrl: NavController
  ) { }

  async ngOnInit() {
    console.log('Data sto ', this.data);
    await this.showPhotoVehiculo('doctsveh');
    this.indexTabGroup = 0;
  }

  async updateValues(){
    await this.generalServ.presentLoading('Guardando ...');
    const payload = {
      solicitud_id: this.data.id,
      vehiculo_id: this.data.complementData.vehiculo.id,
      noserie: this.data.complementData.vehiculo.noserie,
      placas: this.data.complementData.vehiculo.placas
    };

    const query: any = await this.preSolServ.updateSolInfo(payload);
    this.generalServ.dismissLoading();

    if (query.ok) {
      this.generalServ.sweetAlert('Actualizado correctamente', 'success');
      console.log('Datos actualizados');
    }else{
      this.generalServ.sweetAlert('Error al actualizar', 'warning');
      console.log('Error');
    }
  }

  selectStatusLabel() {
    switch (this.data.status){
      case 'reserved':
        return 'Reservada';
      case 'draft':
        return 'Borrador';
      case 'arrived':
        return 'Arrivado';
      case 'open':
        return 'Abierto';
      case 'paid':
        return 'pagada';
      case 'paidlocked':
        return 'Validar pago';
      case 'paidvalid':
        return 'Validando pago';
      case 'locked':
        return 'Encierro';
      case'cancel':
        return 'Cancelada';
      case 'closed':
        return 'Cerrada';
      case 'invoiced' :
        return 'Facturada';
      case 'receivable':
        return 'Cuenta por cobrar';
      case 'released':
        return 'Liberada';
      case 'call_request':
        return 'Solicita llamada';
      case 'quot_request':
        return 'Soliciata cotización';
      case 'on_transit':
        return 'En tránsito';
    }
  }

  async viewTicketPayment() {
    if (this.loadingInit === true) {
      return;
    }
    this.generalServ.presentLoading();
    this.loadingInit = true;
    const data = {
      id: this.data.id
    };
    this.service.getPaymentTicket(data).subscribe(async res => {
      this.loadingInit = false;
      this.generalServ.dismissLoading();
      const modal = await this.modalCtrl.create({
        component: DocsViewerComponent,
        componentProps: {
          document: {
            docURL: res
          }
        },
        cssClass: 'technical-doc',
        swipeToClose: true
      });
      return await modal.present();
    }, error => {
      this.loadingInit = false;
      this.generalServ.dismissLoading();
      console.log(error);
      this.toast.presentToast('No hay información para mostrar');
      return false;
    });
  }


  ngOnChanges(changes: SimpleChanges) {
    const dataChange = changes.data;
    if (dataChange.isFirstChange() === true || dataChange.firstChange === false ) {
      if (this.data) {
        this.evalExpandPanel();
      }
    }
  }

  captureSignature(e){
    this.signature = e;
    this.data.signature = this.signature;
  }

  async attendService() {
    this.sweetMsg.confirmRequest('¿Estás seguro de atender este servicio?').then(async (data) => {
      if (data.value) {
        const coord = await this.geoServ.getCurrentCoords();
        let lat;
        let long;
        if (coord.ok !== true) {
          console.log('Error during obtaing location -->', coord);
        } else {
          lat = coord.lat;
          long = coord.lon;
        }
        const payload = {
          pre_sol_id: this.data.pre_sol_id,
          partner_id: this.data.complementData.partner.id,
          lat,
          lon: long
        };
        this.generalServ.presentLoading('Enviado información ...');
        try {
          const query: any = await this.service.attendPreSolicitudes(payload);
          if (query && query.ok) {
            this.generalServ.dismissLoading();
            this.sweetMsg.printStatus(query.message, 'success');
            if (this.asModal === true) {
              this.dismiss();
            } else {
              this.location.back();
            }
          }
        } catch (e) {
          this.generalServ.dismissLoading();
          console.log(e);
          this.sweetMsg.printStatusArray(e.error.errors, 'error');
        }
      }
    });
  }

  async finishWork() {
    if (!this.data.id) {
      this.sweetMsg.printStatus('No hay pre solicitud para concluir con el trabajo', 'warning');
      return;
    } else if (!this.signature) {
      this.sweetMsg.printStatus('Por favor ingrese una firma', 'warning');
      return;
    }
    this.sweetMsg.confirmRequest('¿Está seguro de querer finalizar y cerrar el servicio?', 'Si', 'No').then(async (data) => {
      if (data.value) {
        const payload = {
          solicitud_id: this.data.id,
          customer_sign: this.signature.signature_img
        };
        const query = await this.preSolServ.saveSignatureAndFinish(payload);
        if (query.ok) {
          this.sweetMsg.printStatus('Datos guardados correctamente', 'success');
          this.navCtrl.navigateRoot('/operador/servicios');
        } else {
          this.sweetMsg.printStatus('Ocurrió un error al guardar la información, intente de nuevo', 'warning');
        }
      }
    });
  }

  setStep(index: number) {
    this.step = index;
  }

  async nextStep() {
    this.step++;
  }

  async prevStep() {
    this.step--;
  }

  async loadTabData(e){
    await this.showPhotoVehiculo(this.photoSides[e.index]);
    this.indexTabGroup = e.index;
    console.log('tab chaged', e);
  }

  async dismiss() {
    await this.modalCtrl.dismiss({ modal: false, data: this.data });
  }

  async doRefresh(e) {
    setTimeout(() => {
      console.log('Async operation has ended');
      e.target.complete();
    }, 2000);
  }

  async showPhotoVehiculo(tipo: string) {
    this.loadingPhotoVehiculo = true;

    const data = {
      solicitud_id: this.data.id,
      section: tipo
    };

    const query = await this.preSolServ.getPartnerDocs(data);

    if (query.ok && query.data) {

      if (tipo === 'doctsveh'){
        this.DocVehiculo = [];
        for (const el of query.data){
          if (el) {
            this.DocVehiculo.push({ image: el.image, id: el.attachment_id });
          }
        }
      }

      if (tipo === 'doctscliente'){
        this.DocCliente = [];
        for (const el of query.data){
          if (el) {
            this.DocCliente.push({ image: el.image, id: el.attachment_id });
          }
        }
      }

      if (tipo === 'front'){
        this.ladoFrente = [];
        for (const el of query.data){
          if (el) {
            this.ladoFrente.push({ image: el.image, id: el.attachment_id });
          }
        }
      }

      if (tipo === 'rear'){
        this.ladoTrasero = [];
        for (const el of query.data){
          if (el) {
            this.ladoTrasero.push({ image: el.image, id: el.attachment_id });
          }
        }
      }

      if (tipo === 'side_a') {
        this.ladoChofer = [];
        for (const el of query.data){
          if (el) {
            this.ladoChofer.push({ image: el.image, id: el.attachment_id });
          }
        }
      }

      if (tipo === 'side_b'){
        this.ladoCopiloto = [];
        for (const el of query.data){
          if (el) {
            this.ladoCopiloto.push({ image: el.image, id: el.attachment_id });
          }
        }
      }

    }
    console.log('query', query);
  }

  confirmRequest() {
      this.modalCtrl.dismiss({ data: this.data });
  }

  evalExpandPanel() {
    console.log('data on expand ---- ', this.data);

    if (this.data.model === 'cms_pre_solicitudes') {
      switch (this.data.status) {
        case 1: // nueva
          this.setStep(0);
          break;
      }
    }

    if (this.data.model === 'cms_padsolicitudes') {
      console.log('inside if');
      switch (this.data.status) {
        case 'arrived': // nueva
        case 'open':
          this.setStep(4);
          break;
      }
    }

  }

  async capturedPhoto(e, type: string) {
    let okFlag = false;
    const payload = {
      solicitud_id: this.data.id,
      section: '',
      pictures: [e]
    };

    if (type === 'DocVehiculo') {
      payload.section = 'doctsveh';
      const q: any = await this.uploadPic(payload);
      await this.generalServ.dismissLoading();
      if (q.ok) {
        this.DocVehiculo.push({ image: e, id: q.data[0].attachment_id });
        okFlag = true;
      }
    }

    if (type === 'DocCliente') {
      payload.section = 'doctscliente';
      const q: any = await this.uploadPic(payload);
      await this.generalServ.dismissLoading();
      if (q.ok) {
        this.DocCliente.push({ image: e, id: q.data[0].attachment_id });
        okFlag = true;
      }
    }

    if (type === 'ladoFrente') {
      payload.section = 'front';
      const q: any = await this.uploadPic(payload);
      await this.generalServ.dismissLoading();
      if (q.ok) {
        this.ladoFrente.push({ image: e, id: q.data[0].attachment_id });
        okFlag = true;
      }
    }

    if (type === 'ladoTrasero') {
      payload.section = 'rear';
      const q: any = await this.uploadPic(payload);
      if (q.ok) {
        this.ladoTrasero.push({ image: e, id: q.data[0].attachment_id });
        okFlag = true;
      }
    }

    if (type === 'ladoChofer') {
      payload.section = 'side_a';
      const q: any = await this.uploadPic(payload);
      if (q.ok) {
        this.ladoChofer.push({ image: e, id: q.data[0].attachment_id });
        okFlag = true;
      }
    }

    if (type === 'ladoCopiloto') {
      payload.section = 'side_b';
      const q: any = await this.uploadPic(payload);
      if (q.ok) {
        this.ladoCopiloto.push({ image: e, id: q.data[0].attachment_id });
        okFlag = true;
      }
    }
    if (okFlag === true) {
      await this.showPhotoVehiculo(this.photoSides[this.indexTabGroup]);
    }
  }

  async uploadPic(payload: any) {
    await this.generalServ.presentLoading('Subiendo fotografía');
    const query: any = await this.preSolServ.uploadPicture(payload);
    await this.generalServ.dismissLoading();
    if (query.ok) {
      this.generalServ.sweetAlert('Guardado correctamente', 'success');
      return {ok: true, data: query.data};
    }else {
      this.generalServ.sweetAlert('Error al guardar', 'warning');
      return {ok: false};
    }
  }

  deletePhoto(i, type: string, attachment) {

    this.sweetMsg.confirmRequest('¿Estás seguro de querer adjuntar este archivo?').then(async (data) => {
      const payload = {
        solicitud_id: this.data.id,
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
      if (type === 'doctscliente') {
        document.getElementById(`DocCliente_${i}`).remove();
        this.DocCliente.splice(i, 1);
      }
      if (type === 'front') {
        document.getElementById(`ladoFrente_${i}`).remove();
        this.ladoFrente.splice(i, 1);
      }
      if (type === 'rear') {
        document.getElementById(`ladoTrasero_${i}`).remove();
        this.ladoTrasero.splice(i, 1);
      }
      if (type === 'side_a') {
        document.getElementById(`ladoChofer_${i}`).remove();
        this.ladoChofer.splice(i, 1);
      }
      if (type === 'side_b') {
        document.getElementById(`ladoCopiloto_${i}`).remove();
        this.ladoCopiloto.splice(i, 1);
      }
    } else {
      this.sweetMsg.printStatus('Error al eliminar', 'warning');
    }

  }

  async canCaptureSignature() {
    const _data = {
      solicitud_id: this.data.id,
    };
    this.generalServ.presentLoading('Verificando información');
    const res = await this.preSolServ.canSign(_data);
    this.generalServ.dismissLoading();
    if (res.ok) {
      this.canSign = true;
      this.nextStep();
    } else {
      this.canSign = false;
      this.sweetMsg.printStatusArray(res.error.error.errors, 'error');
      return;
    }
  }

}

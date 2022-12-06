import {IonRouterOutlet, NavController, Platform} from '@ionic/angular';
import {Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter, OnDestroy} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OpenStreetGeoCodeI } from '../../interfaces/open-street-map/open-street-geocode';
import { PopoverController } from '@ionic/angular';

import {
  NativeGeocoder,
  NativeGeocoderResult,
  NativeGeocoderOptions,
} from '@ionic-native/native-geocoder/ngx';
import { GeocoderService } from '../../services/geocoder.service';
import {Observable, Subscription} from 'rxjs';
import {SweetMessagesService} from '../../services/sweet-messages.service';
import {PreSolicitudI} from '../../interfaces/pre-solicitud/pre-solicitud.interface';
import {GeneralService} from '../../services/general.service';
import {AsistenciasService} from '../../services/asistencias.service';
import {DateConv} from '../../helpers/date-conv';
import * as moment from 'moment';
import {Router} from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { TimerService } from '../../services/timer.service';
import {SolicitudesStatus} from '../../enums/solicitudes-status.enum';
import {PreSolicitudesService} from '../../services/pre-solicitudes.service';
import { PhotoModalComponent } from '../../common/modals/photo-modal/photo-modal.component';
import {GeoService} from '../../services/geo.service';
import { Geolocation } from '@capacitor/geolocation';

declare var google;

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss'],
})
export class GoogleMapsComponent implements OnInit, OnDestroy {

  @ViewChild('map', { static: false }) mapElement: ElementRef;
  @Input() traceRoute: Observable<void>;
  @Input() reloadM: Observable<void>;
  @Input() loadMap: Observable<any>;
  @Input() resetMap: Observable<any>;
  @Output() openDetails = new EventEmitter();
  public mapMarkers = [];
  private eventsSubscription: Subscription;
  private reloadSubscription: Subscription;
  private loadMapSubscription: Subscription;
  private resetMapSubscription: Subscription;
  public map: any;
  public address: string;
  public latitude: number;
  public longitude: number;
  public openStreetGeoCode: OpenStreetGeoCodeI;
  public iconBase = 'assets/map_pins/';
  public timeToWait = 5;
  public intervalCounter: any;
  public seconds = 60;
  public progress = '';
  public timeTotal: number;
  public warningTime: number;
  public dangerTime: number;
  public index: number;
  public dateToCompare: any;
  public dateHelper = DateConv;
  public isInService = false;
  public infoWindows = [];
  public firstLoad = true;
  public markersArray = [];
  public infoWindowButtons = [];
  public isInTransit = false;
  public isArrived = false;
  public directionsService = new google.maps.DirectionsService();

  timeLeft: number;
  progressBarWidth: number;

  public icons: Record<string, { icon: string }> = {
    myCheck: {
      icon: this.iconBase + 'pin-mi-ubicacion.svg',
    },
    service: {
      icon: this.iconBase + 'pin-servicio.svg',
    },
    serviceSelect: {
      icon: this.iconBase + 'pin-servicio-select.svg',
    },
  };

  loadingInprocess = false;

  constructor(
    private nativeGeocoder: NativeGeocoder,
    private platform: Platform,
    public geocoderServ: GeocoderService,
    public sweetMsg: SweetMessagesService,
    public generalServ: GeneralService,
    private service: AsistenciasService,
    public navigate: NavController,
    private router: Router,
    public popoverController: PopoverController,
    private storage: StorageService,
    private timer: TimerService,
    private preSolServ: PreSolicitudesService,
    public modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private geoServ: GeoService
  ) {}

  async createMap(){
    await this.evalHowToLoad();
    // await this.searchForActiveServices();
  }

  async ngOnInit() {
    console.log('loading from ngOnInit map -->', true);

    this.eventsSubscription = this.traceRoute.subscribe((e) => this.traceMapRoute(e));
    this.reloadSubscription = this.reloadM.subscribe(async (e) => this.reloadMap(e));
    this.loadMapSubscription = this.loadMap.subscribe(async (e) => this.loadM(e));
    this.resetMapSubscription = this.resetMap.subscribe(async (e) => this.clearMap());
  }

  async evalHowToLoad(data?: boolean) {
    try {
      this.isInService = false;
      this.isInTransit = await this.storage.get('isInTransit');
      this.isArrived = await  this.storage.get('isArrived');

      console.log('is in transit ', this.isInTransit);
      console.log('is arrived ', this.isArrived);
      if (this.loadingInprocess === false) {
        if (this.isInTransit) {
          this.isInService = true;
          this.loadingInprocess = true;
          this.generalServ.presentLoading();
          const response: any = await this.service.getActiveSols();
          this.generalServ.dismissLoading();
          if (response && response.ok) {
            this.loadingInprocess = false;
            this.storage.set('preSol', response.solicitudes);

            if (response.solicitudes.status === 'arrived') {
              await this.setArrive();
            }
          } else {
            this.loadingInprocess = false;
            console.log('no inproccess');
            await this.storage.delete('preSol');
            this.storage.set('isInTransit', false);
            this.storage.set('isArrived', false);
            return;
          }
          const solicitudes = [response.solicitudes];
          this.mapMarkers = solicitudes;
          const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          };
          Geolocation.getCurrentPosition(options).then(async (res) => {
            this.latitude = res.coords.latitude;
            this.longitude = res.coords.longitude;
            this.traceMapRoute({data: this.mapMarkers[0]});
          });

        } else if (this.isArrived) {

          await this.searchForActiveServices(data);
          this.traceMapRoute({data: this.mapMarkers[0]});
        } else {
          await this.searchForActiveServices(data);
        }

      }
    } catch (e) {
      this.loadingInprocess = false;
      console.log(e);
    }
  }

  navigateTo(path) {
    this.navigate.navigateRoot([`operador/${path}`]);
  }

  clearMap() {
    console.log('Clearing map');
    if (this.markersArray && this.infoWindows && this.infoWindowButtons) {
      for (const i in this.markersArray) {
        this.markersArray[i].setMap(null);
      }
      this.markersArray.length = 0;
      this.infoWindows = [];
      this.infoWindowButtons = [];
    }
  }

  async searchForPreSol(data) {
    const query: any = await this.service.getActiveSols(data);
    if (query.ok) {
      const solicitudes = [query.solicitudes];
      this.mapMarkers = solicitudes;
      this.storage.set('preSol', query.solicitudes);
    }
    console.log('response solicitudes activas', query);
  }

  async loadM(e) {
    console.log('load map from component data: ');
    await this.createMap();
  }

  async searchForActiveServices(data?) {

    await this.generalServ.presentLoading('Cargando mapa ...');
    this.loadingInprocess = true;
    const response: any = await this.service.getActiveSols();
    console.log('Response from server 174', response);
    if (response.ok) {
      this.loadingInprocess = false;
      this.isInService = true;
      if (response.solicitudes.status === SolicitudesStatus.ARRIBADA) {
        this.isArrived = true;
        this.storage.set('isArrived', true);
      }
      const solicitudes = [response.solicitudes];
      this.mapMarkers = solicitudes;
      const payload = {
        id: response.solicitudes.id,
        model: response.solicitudes.model
      };
      this.storage.set('preSol', response.solicitudes);
      //await this.searchForPreSol(payload);
      await this.getCurrentCoords();
    } else {
      this.loadingInprocess = false;
      this.mapMarkers = [];
      await this.getCurrentCoords();
      await this.storage.clear();
      this.traceMapRoute(null);
      this.isInService = false;
    }
  }

  ngOnDestroy() {
    console.log('Leaving map...');
    if (this.platform.resume && this.platform.pause && this.eventsSubscription && this.reloadSubscription){
      this.platform.resume.unsubscribe();
      this.platform.pause.unsubscribe();
      this.eventsSubscription.unsubscribe();
      this.reloadSubscription.unsubscribe();
    }
  }

  ionViewDidLeave(){
    console.log('dismiss maps');
  }

  async reloadMap(data) {
    console.log('reload map');
    this.clearMap();
    await this.geoServ.getCurrentCoords();
    await this.evalHowToLoad(data);
  }

  traceMapRoute(data?) {
    const directionsRenderer = new google.maps.DirectionsRenderer({suppressMarkers: true});
    if (!data) {
      directionsRenderer.setMap(null)
      return;
    }
    console.log('Tracing route...', data);
    console.log('Tracing route...', data.data.cords);

    const directionsService = new google.maps.DirectionsService();
    const map = new google.maps.Map(
        document.getElementById('map') as HTMLElement,
        {
          zoom: 16,
          center: { lat: this.latitude, lng: this.longitude },
          disableDefaultUI: true
        }
    );
    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(
      document.getElementById('sidebar') as HTMLElement
    );
    this.calculateAndDisplayRoute(directionsService, directionsRenderer,
        {long: parseFloat(data.data.cords.lon), lat: parseFloat(data.data.cords.lat)}, map, data.data.status);
  }

  async presentModal(data) {
    const modal = await this.modalController.create({
      component: PhotoModalComponent,
      cssClass: 'my-custom-class',
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { data: data }
    });
    await modal.present();
    const modalDismiss: any = await modal.onDidDismiss();
    console.log('onDidDismiss', modalDismiss);

    if (modalDismiss.data && modalDismiss.data.ok){
      const lapse = await this.timer.getLapse();
      const sol = await this.storage.get('preSol');

      await this.timer.endTime();

      console.log('pre sol', sol);

      if (sol && lapse) {
        this.isInTransit = null;
        this.isInService = null;
        const query = await this.service.changeStatus({
          'solicitud_id': sol.id,
          'status': 'arrived',
          'tmrealarribo': lapse
        });
        console.log('response from service', query);
        if (query.ok) {
          await this.storage.clear();
          this.navigate.navigateRoot(`/operador/servicios/${sol.id}`);
        }
      }
    }
  }

  async setArrive() {

    this.generalServ.presentLoading('Cargando información ...');
    const lapse = await this.timer.getLapse();
    const sol = await this.storage.get('preSol');

    const query = await this.preSolServ.getPartnerDocs({
      solicitud_id: sol.id,
      section: 'doctsveh'
    });
    this.generalServ.dismissLoading();
    if (query.ok && query.data.length === 0) {
      await this.presentModal({
        solicitud_id: sol.id,
        section: 'doctsveh'
      });
    } else {
      await this.timer.endTime();

      console.log('pre sol', sol);

      if (sol && lapse) {
        this.isInTransit = null;
        this.isInService = null;
        if (sol.status === 'arrived' || sol.status === 'open') {
          await this.storage.clear();
          this.navigate.navigateRoot(`/operador/servicios/${sol.id}`);
          return;
        }
        this.generalServ.presentLoading('Enviando información');
        const query = await this.service.changeStatus({
          'solicitud_id': sol.id,
          'status': 'arrived',
          'tmrealarribo': lapse
        });
        console.log('response from service', query);
        this.generalServ.dismissLoading();
        if (query.ok) {
          await this.storage.clear();
          this.navigate.navigateRoot(`/operador/servicios/${sol.id}`);
        } else {
          this.sweetMsg.printStatus(`Hubo un error al guardar el estatus. <br> El mapa se recargara en un momento`, 'error');
          await this.reloadMap(true);
        }
      }
      console.log('Time lapse', lapse);
    }
  }

  calculateAndDisplayRoute(directionsService, directionsRenderer, destination, map, _status?) {
    console.log('origin data', this.latitude, this.longitude);
    console.log('destination data', destination);
    console.log('is in transit route', this.isInTransit);

    directionsService
        .route({
          origin: new google.maps.LatLng(this.latitude, this.longitude),
          destination: new google.maps.LatLng(destination.lat, destination.long),
          travelMode: google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(Date.now()),
            trafficModel: 'optimistic'
          }
        })
        .then( async (response, status) => {
          const leg = response.routes[0].legs[0];
          this.isInTransit = true;

          console.log('a-b posotion', leg);

          const marker = new google.maps.Marker({
            position: leg.end_location,
            icon: {
              url: this.icons.service.icon,
              size: new google.maps.Size(36, 50),
              scaledSize: new google.maps.Size(36, 50),
              anchor: new google.maps.Point(0, 50)
            },
            map: map,
          });

          const b = new google.maps.Marker({
            position: leg.start_location,
            icon: {
              url: this.icons.myCheck.icon,
              size: new google.maps.Size(36, 50),
              scaledSize: new google.maps.Size(36, 50),
              anchor: new google.maps.Point(0, 50)
            },
            map: map,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: this.createMarkerContent(this.mapMarkers[0], 0)
          });

          google.maps.event.addListener(infoWindow, 'domready', () => {
            const goService = document.getElementById('goService_' + 0);
            const details = document.getElementById('details_' + 0);
            const startRoute = document.getElementById('startRoute_' + 0);
            const counter = document.getElementById('progressBar' + 0);

            if (this.mapMarkers[0].model === 'cms_padsolicitudes') {
              counter.style.display = 'none';
            }
            goService.style.display = 'none';
            startRoute.style.display = 'none';
          });

          marker.addListener('click', () => {
            infoWindow.open({
              anchor: marker,
              map,
              shouldFocus: false,
            });
          });

          directionsRenderer.setDirections(response);
          console.log(response);

          if (_status === 'reserved' || _status === 'draft') {
            this.generalServ.presentLoading('Guardando Ruta');
            await this.saveTraceRoute(response, destination);
            this.generalServ.dismissLoading();
          }

        })
        .catch((e) => window.alert('Directions request failed due to ' + e));
  }

  async saveTraceRoute(routeData, dataSol) {
    console.log('Marker to save trace route: ', this.mapMarkers);
    console.log('Maps route info: ', routeData, dataSol);
    const distance = routeData.routes[0].legs[0].distance;
    const duration = routeData.routes[0].legs[0].duration;
    const duration_in_traffic = routeData.routes[0].legs[0].duration_in_traffic;
    const start_address = routeData.routes[0].legs[0].start_address;
    const start_location = routeData.routes[0].legs[0].start_location;
    const end_location = routeData.routes[0].legs[0].end_location

    const payload = {
      'solicitud_id': this.mapMarkers[0].id,
      'status': 'on_transit',
      'partner_id': this.mapMarkers[0].complementData.partner.id,
      'lat_operador': this.latitude,
      'lon_operador': this.longitude,
      'lat_partner': this.mapMarkers[0].cords.lat,
      'lon_partner': this.mapMarkers[0].cords.lon,
      distance,
      duration,
      duration_in_traffic,
      start_address,
      start_location,
      'end_address': routeData.routes[0].legs[0].end_address,
      end_location,
      'full_directions':"toda la info de direcciones"
    };

    const query: any = await this.service.changeStatus(payload);
    if (query.ok) {
      const isTransit = this.storage.get('isInTransit');
      console.log('setting in transit ', isTransit);
      if (isTransit) {
        this.timer.startTime();
      }
      this.storage.set('isInTransit', true);
    } else {
      this.sweetMsg.printStatus(`Hubo un error al guardar el estatus. <br> El mapa se recargara en un momento`, 'error');
      await this.reloadMap(true);
    }
  }

  buttonClick(e){
    console.log(this.timeToWait);
  }

  startRoute(e) {
    console.log('service', e);
    this.traceMapRoute({data: e});
  }

  openDetailsClick(details) {
    details['isInService'] = this.isInService;
    console.log('Open details... ');
    this.openDetails.emit(details);
  }

  stopIntervalCounter(){
    clearInterval(this.intervalCounter);
  }

  async getCurrentCoords() {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(options).then( async (res) => {
        this.latitude = res.coords.latitude;
        this.longitude = res.coords.longitude;
        if (this.mapMarkers.length == 0) {
          console.log('No markers');
          const query: any = await this.service.getPreSolicitudes({lat: this.latitude, lon: this.longitude });
          console.log('response from server', query);
          if (query.ok) {
            this.mapMarkers = query.solicitudes;
            resolve(true);
          } else {
            this.generalServ.dismissLoading();
            await this.storage.clear();
          }
        }
        this.getAddressFromGeoCoords();
        this.initMap(this.latitude, this.longitude);
        console.log('Geolocation', this.latitude, this.longitude);
      }, error => {
        if (error.code == 1) {
          console.log('Error on geo location', error);
          // Forzamos a colocar playa del carmen
          this.latitude = 20.6338054;
          this.longitude = -87.085475;
          this.getAddressFromGeoCoords();
          this.initMap(this.latitude, this.longitude);
          reject(false);
        }

      });
    })

  }

  initMap(lat, long) {
    const mapProp = {
      center: new google.maps.LatLng(lat, long),
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      clickableIcons: false
    };
    try {
      const map = new google.maps.Map(this.mapElement.nativeElement, mapProp);

      for (let i = 0; i < this.mapMarkers.length; i++) {
        const infoWindow = new google.maps.InfoWindow({
          content: this.createMarkerContent(this.mapMarkers[i], i)
        });

        this.infoWindows.push(infoWindow);

        google.maps.event.addListener(infoWindow, 'domready', () => {

          const goService = document.getElementById('goService_' + i);
          const details = document.getElementById('details_' + i);
          const startRoute = document.getElementById('startRoute_' + i);
          const id = i;

          const counter = document.getElementById('progressBar' + i);

          if (this.mapMarkers[i].model === 'cms_padsolicitudes') {
            counter.style.display = 'none';
          }

          if (this.mapMarkers[i].model === 'cms_pre_solicitudes') {
            startRoute.style.display = 'none';
          }

          if (this.isInService) {
            goService.style.display = 'none';
          } else {
            startRoute.style.display = 'none';
          }
          const convertDate = this.dateHelper.transFormDate(this.mapMarkers[i].date, 'localTimeMoment');
          if (this.mapMarkers[i].model === 'cms_pre_solicitudes') {
            this.initServiceCounter(convertDate, id);
          }

          if (!this.infoWindowButtons.includes('details_' + i)) {
            this.infoWindowButtons.push('details_' + i);
            goService.addEventListener('click', async (e) => {
              await this.attendService(this.mapMarkers[i]);
            });
          }
          if (!this.infoWindowButtons.includes('goService_' + i)) {
            this.infoWindowButtons.push('goService_' + i);
            details.addEventListener('click', (e) => {
              this.openDetailsClick(this.mapMarkers[i]);
            });
          }
          if (!this.infoWindowButtons.includes('startRoute_' + i)) {
            this.infoWindowButtons.push('startRoute_' + i);
            startRoute.addEventListener('click', (e) => {
              console.log('startRoute', true);
              this.startRoute(this.mapMarkers[i]);
            });
          }
        });

        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(this.mapMarkers[i].cords.lat, this.mapMarkers[i].cords.lon),
          icon: {
            url: this.icons.service.icon,
            size: new google.maps.Size(36, 50),
            scaledSize: new google.maps.Size(36, 50),
            anchor: new google.maps.Point(0, 50)
          },
          map: map,
          zIndex: 1000 + i
        });
        this.markersArray.push(marker);
        marker.addListener('click', () => {
          if (this.infoWindows.length) {
            for (let x = 0; x < this.infoWindows.length; x++) {
              this.infoWindows[x].close();
            }
            infoWindow.close();
          }
          infoWindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
          });
        });

        if (this.isInService) {
          infoWindow.open(map, marker);
        }

        google.maps.event.addListener(infoWindow, 'closeclick', (e) => {
          console.log('Info window closed... ');
        });
      }

      console.log('marker', lat, long);
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, long),
        map: map,
        // draggable: false,
        icon: {
          url: this.icons.myCheck.icon,
          size: new google.maps.Size(36, 50),
          scaledSize: new google.maps.Size(36, 50),
          anchor: new google.maps.Point(0, 50)
        }
      });

      this.markersArray.push(marker);

      google.maps.event.addListener(marker, 'dragend', (event) => {
        this.latitude = event.latLng.lat();
        this.longitude = event.latLng.lng();
        this.getAddressFromGeoCoords();
      });

      google.maps.event.addListener(map, 'click', (event) => {
        this.getAddressFromGeoCoords();
      });

      if (this.generalServ) {
        this.generalServ.dismissLoading();
      }
    } catch (e) {
      console.log('Error on creating map', e);
      if (this.generalServ) {
        this.generalServ.dismissLoading();
      }
    }

  }

  async attendService(data: PreSolicitudI) {
    this.storage.set('preSol', data);
    console.log('Atendiendo servicio... ', data);
    this.sweetMsg.confirmRequest('¿Estás seguro de atender este servicio?').then(async (value) => {
      if (value.value) {
        const payload = {
          pre_sol_id: data.pre_sol_id ? data.pre_sol_id : data.id,
          partner_id: data.complementData.partner.id,
          lat: this.latitude,
          lon: this.longitude
        };
        await this.generalServ.presentLoading('Enviado información ...');
        try {
          const query: any = await this.service.attendPreSolicitudes(payload);
          if (query && query.ok) {
            this.generalServ.dismissLoading();
            this.sweetMsg.printStatus(query.message, 'success');
            await this.searchForActiveServices();
            await this.router.navigate(['operador/servicios']);
          }
        } catch (e) {
          this.generalServ.dismissLoading();
          console.log(e);
          this.sweetMsg.printStatusArray(e.error.errors, 'error');
        }
      }
    });
  }

  getAddressFromGeoCoords() {
    this.geocoderServ.getReverseCoordsData(this.latitude, this.longitude).subscribe(res => {
      if (res) {
        this.openStreetGeoCode = res;
        this.address = this.openStreetGeoCode.address.road
        + ', ' + this.openStreetGeoCode.address.city
        + ', ' + this.openStreetGeoCode.address.country
        + ', ' + this.openStreetGeoCode.address.state
        + ', ' + this.openStreetGeoCode.address.postcode
        + ', ' + this.openStreetGeoCode.address.country;
      }
    });
  }

  getAddressFromCoords(lattitude, longitude) {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      console.log('getAddressFromCoords ' + lattitude + ' ' + longitude);
      const options: NativeGeocoderOptions = {
        useLocale: true,
        maxResults: 5,
      };

      this.nativeGeocoder
        .reverseGeocode(lattitude, longitude, options)
        .then((result: NativeGeocoderResult[]) => {
          this.address = '';
          const responseAddress = [];
          for (const [key, value] of Object.entries(result[0])) {
            if (value.length > 0) { responseAddress.push(value); }
          }
          responseAddress.reverse();
          for (const value of responseAddress) {
            this.address += value + ', ';
          }
          this.address = this.address.slice(0, -2);
        })
        .catch((error: any) => {
          this.address = 'Address Not Available!';
        });
    } else {
      this.address = 'Address Not Available!';
    }
  }

  createMarkerContent(data: any, id: number) {
    console.log(data);
    const markContent = `<ion-card style="margin: 0 !important;">
    <ion-card-header style="padding-top: 0 !important; padding-bottom: 1px !important;">
        <ion-card-subtitle><span>Folio: ${data.folio}</span></ion-card-subtitle>
        <ion-card-title>
            <p><text style="font-size: 9px; float:right; padding-top: 3px;">${DateConv.transFormDate(data.date, 'localTime')}</text></p>
            <div style="width: 90%;text-align: right;margin: 0 auto; display: flex; flex-direction: column;">
                <span id="vigencia${id}" class="vigencia" style="color: darkgreen;">${(data.model === 'cms_pre_solicitudes') ? 'Minutos de Vigencia' : ''}</span>
            </div>
            <div id="progressBar${id}" class="progressBar">
                <div class="bar" id="bar${id}"></div>
            </div>
        </ion-card-title>
    </ion-card-header>
   <ion-row class="cardfooter">
     <ion-col style="text-align: center" id="inService_${id}">
          <ion-button size="small" color="success" id="startRoute_${id}" style="${(data.status === 'reserved' || data.status === 'draft') ? '' : 'display: none'}">Iniciar Recorrido</ion-button>
      </ion-col>

      <ion-col class="ion-float-left">
          <ion-button size="small" color="success" id="goService_${id}" >Atender Servicio</ion-button>
      </ion-col>
      <ion-col class="ion-float-right">
          <ion-button style="float: right;" size="small" color="medium" id="details_${id}">Detalles</ion-button>
      </ion-col>
  </ion-row>
    <ion-card-content style="margin: 0 !important; padding: 0;">
    <ion-row style="border-bottom-style: dotted; align-items: center;" class="ion-justify-content-center">
        <ion-col>
            <p>
               <text style="font-size: smaller">${data.car_details.brand} ${data.car_details.model}</text>
               <br>
               <strong>${data.car_details.plates}</strong>
               <text style="font-size: smaller"> ${data.car_details.color}   ${data.car_details.year} </text>
            </p>
        </ion-col>
        <ion-col style="border-right-style: outset" size="fill">
            <ion-img style="width: 40px; height: 30px; float: right;" src="assets/img/static/tipo-vehiculo/sedan.svg"></ion-img>
            <div></div>
        </ion-col>
        <ion-col size="fill">
            <ion-img style="width: 30px; height: 30px;" src="assets/img/static/avatar.svg"></ion-img>
        </ion-col>
        <ion-col>
            <p><strong style="font-size: x-small">${data.user_data}</strong></p>
        </ion-col>
        <ion-col>
            <a href="tel:+52${data.complementData.telefono}">
                <ion-img id="callClick_${id}" style="width: 30px; height: 30px; background-color: #3F8BC6; border-radius: 50%; padding: 7px;" src="assets/img/static/phone-call.svg"></ion-img>
            </a>
        </ion-col>
    </ion-row>
    <ion-row>
        <ion-badge color="secondary" style="margin-top: 7px">Local</ion-badge>
    </ion-row>
    <ion-grid>
        <ion-row>
            <ion-col size="2">
                <ion-img style="height:100px; width:20px" src="assets/img/static/pin-to-destination.svg"></ion-img>
            </ion-col>
            <ion-col size="10">
                <p style="font-size: 12px;">${data.service_details.from}</p>
                <br>
                <p style="font-size: 12px;">${data.service_details.to}</p>
            </ion-col>
        </ion-row>
    </ion-grid>
  </ion-card-content>
`;

    return markContent;
  }

  initServiceCounter(dateToCompare, id) {
    if (!this.warningTime) {
      this.warningTime = 250;
    }
    if (!this.dangerTime) {
      this.dangerTime = 150;
    }
    if (!this.timeTotal) {
      this.timeTotal = 300;
    }
    if (!this.index) {
      this.index = Math.floor(Math.random() * 100);
    }
    setTimeout(() => {
      this.progressTime( (this.getLeftSeconds(dateToCompare) === 0) ? 0 : this.timeTotal - this.getLeftSeconds(dateToCompare), this.timeTotal, id);
    }, 500);
  }

  getLeftSeconds(dateToCompare) {
    const duration = moment.duration(moment().diff(dateToCompare));
    const seconds = duration.asSeconds();
    if (seconds > this.timeTotal) {
      return 0;
    }
    return Number(Number(seconds).toFixed(0));
  }

  progressTime(timeleft, timetotal, id) {

    const element: HTMLElement = document.getElementById('progressBar' + id);

    if (element) {
      this.progressBarWidth = timeleft * element.offsetWidth / timetotal;

      let _seconds;
      if (timeleft % 60 > 9) {
        _seconds = String(timeleft % 60);
      } else {
        _seconds = '0' + String(timeleft % 60);
      }

      const _left = (Math.floor(timeleft / 60) + ':' + _seconds);
      const _left2 = (Math.floor(timeleft / 60) + _seconds);
      document.getElementById('bar' + id).innerHTML = `${_left}`;
      document.getElementById('bar' + id).style.width = `${this.progressBarWidth}px`;
      if (_left2 < this.warningTime && _left2 > this.dangerTime) {
        document.getElementById('bar' + id).style.backgroundColor = 'rgb(234, 158, 18)';
        document.getElementById('bar' + id).style.color = 'white';
        document.getElementById('vigencia' + id).style.color = 'rgb(234, 158, 18)';
      } else if (_left2 < this.dangerTime) {
        document.getElementById('bar' + id).style.backgroundColor = 'darkred';
        document.getElementById('bar' + id).style.color = 'white';
        document.getElementById('vigencia' + id).style.color = 'darkred';
      }
      if (timeleft === 0) {
        document.getElementById('bar' + id).innerHTML = `0.0`;
        document.getElementById('vigencia' + id).innerHTML = `Tiempo agotado`;

      }
      if (timeleft > 0) {

        setTimeout(() => {
          this.progressTime(timeleft - 1, timetotal, id);
        }, 1000);
      }
    }

  }

  getStatusIn() {
    if (this.isArrived) {
      return 'Levantamiento';
    } else if (this.isInTransit) {
      return 'En ruta';
    }
    return '';
  }

}

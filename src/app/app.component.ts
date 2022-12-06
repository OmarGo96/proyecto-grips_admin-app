import { Component } from '@angular/core';
import {NavController, Platform} from '@ionic/angular';
import { AudioSoundsService } from './services/audio-sounds.service';
import { GeneralService } from './services/general.service';
import { PushNotificationsService } from './services/push-notifications.service';
import { SessionService } from './services/session.service';
import {GeoService} from './services/geo.service';
import {AsistenciasService} from './services/asistencias.service';
import { StorageService } from './services/storage.service';
import {Subject} from 'rxjs';
import {App} from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  gpsReminder = 60000; // 1 minuto
  appVersion: string;

  constructor(
    private platform: Platform,
    private pushNotiServ: PushNotificationsService,
    private audioServ: AudioSoundsService,
    public generalServ: GeneralService,
    public sessionServ: SessionService,
    public geoServ: GeoService,
    public asistenciasServ: AsistenciasService,
    public navigate: NavController,
    private storage: StorageService
  ) {
    this.initializeApp();
  }

  initializeApp() {
   this.platform.ready().then(async () => {
      console.log('platform ready');

      //Obtenemos versión de app
      if (this.platform.is('capacitor') || this.platform.is('cordova')) {
        this.appVersion = 'Versión: ' + (await App.getInfo()).version
      }

      this.generalServ.checkNetworkStatus();

      this.sessionServ.keepLookPermissions$ = new Subject<boolean>();
      this.geoServ.requestPermissions();

      if (this.sessionServ.isLogged()) {
        this.generalServ.initConfigParams();
      }

      this.audioServ.preload();
      if (this.platform.is('capacitor') || this.platform.is('cordova')) {
        this.pushNotiServ.initCapacitorNotifications();
      } else {
        this.pushNotiServ.initWebNotifications();
      }

    });



   this.storage.init();
  }
}

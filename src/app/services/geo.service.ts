import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {LoadingController, Platform} from '@ionic/angular';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {Observable} from "rxjs/internal/Observable";
import {map} from "rxjs/operators";

import { Geolocation } from '@capacitor/geolocation';
import {SweetMessagesService} from './sweet-messages.service';
import {SessionService} from './session.service';
import {BehaviorSubject} from 'rxjs';
import {GeneralService} from './general.service';


@Injectable({
  providedIn: 'root'
})
export class GeoService {

  //#region Atributos
  public apiUrl = environment.API_URL;
  public operatorURL = environment.OPERATOR_URL;

  public gpsAvailable$ = new BehaviorSubject<boolean>(null);
  //#endregion

  constructor(
    public loadingController: LoadingController,
    public httpClient: HttpClient,
    public router: Router,
    private platform: Platform,
    private sweetServ: SweetMessagesService,
    private sessionServ: SessionService,
    public generalServ: GeneralService
    //private geolocation: Geolocation,
  ) {
  }


  public async saveGeoPosition(available: boolean, background: boolean) {
    try {
      if (!background) {
        this.generalServ.loadNgxSpinner('Guardando disponibilidad', 'maps');
      }
      let coord = await this.getCurrentCoords();
      if (coord.ok !== true) {
        console.log('Error during obtaing location -->', coord);
        this.sessionServ.isOnService$.next(false);
        if(!background) {
          this.generalServ.hideNgxSpinner();
        }
        return false;
      }
      let data = {
        lat: coord.lat,
        lon: coord.lon,
        available: available
      };
      this.sendGeoPosition(data).subscribe(res => {
        if(!background) {
          this.generalServ.hideNgxSpinner();
        }
        if (res.ok === true) {
          console.log('Geo saving ok');
        }
      }, error => {
        if(!background) {
          this.generalServ.hideNgxSpinner();
        }
        console.log(error);
        this.sessionServ.isOnService$.next(false);
        return false;
      });
    } catch (e) {
      if(!background) {
        this.generalServ.hideNgxSpinner();
      }
      console.log('Error during saving location -->', e);
      this.sessionServ.isOnService$.next(false);
      return false;
    }

    return true;
  }

  public sendGeoPosition(data): Observable<any> {
    return this.httpClient.post<any>(`${this.operatorURL}/user/tracking`, data).pipe(map(response => {
      return response;
    }));
  }


  async requestPermissions() {
    if (this.platform.is('capacitor') || this.platform.is('cordova')) {
      let res = await Geolocation.requestPermissions();
      if (res.location !== 'granted') {
        this.gpsAvailable$.next(false);
        this.sweetServ.printWarning('GPS - WARNING','Es necesario habilitar el gps y darle permisos a la aplicación');
      } else {
        this.gpsAvailable$.next(true);
      }
    }
  }

  async getCurrentCoords(): Promise<{ ok: boolean, lat: number, lon: number, error?: any }> {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
    try {
      let res = await Geolocation.getCurrentPosition(options);
      //console.log('getCurrentCoords --->', res);
      if (res.coords) {
        this.gpsAvailable$.next(true);
        return {ok: true, lat: res.coords.latitude, lon: res.coords.longitude};
      }
    } catch (e) {
      this.gpsAvailable$.next(false);
      this.sweetServ.printWarning('GPS - WARNING', 'Es posible que tu GPS este deshabilitado, ve a configuraciónes para habilitar tu gps.');
      let data = {
        lat: 0,
        lon: 0,
        available: false
      };
      this.sendGeoPosition({
        data
      }).subscribe();

      this.sessionServ.setIsInService(false);
      return {lat: 0, lon: 0, ok: false, error: e};
    }
  }
}

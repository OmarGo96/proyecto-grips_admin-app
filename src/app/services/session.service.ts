import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UserClient } from '../interfaces/user-client';
import {Network} from '@capacitor/network';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  // region Atributos
  public JWToken = 'TK1983!';
  public profileToken = 'PF849!';
  public permissionToken = 'PSK2358!';
  public fCMToken = 'FCMTOKEN';

  public role;
  public url: string;
  public operatorURL = environment.OPERATOR_URL;
  public profile: any;

  public userData: UserClient;

  public checkOnServiceDB = false;

  public isOnService$ = new BehaviorSubject<boolean>(undefined);
  public permitionsIntervalId: number;
  public keepLookPermissions$: Subject<boolean> = new Subject<boolean>();
  // endregion

  // region Constructor
  constructor(
    public httpClient: HttpClient,
    public navigate: NavController
     ) {
    this.url = environment.API_URL;

  }
  // endregion

  // region Métodos

  // Obtiene el token guardado en sessionStorage, si no existe devuelve null
  getToken() {
    const token = localStorage.getItem(this.JWToken);
    if (token != 'undefined') {
      return token;
    } else {
      return null;
    }
  }

  // Función para enviar las credendiales de autenticación con el backend
  signup(data): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.httpClient.post(this.operatorURL + '/login', data, {
      headers,
    });
  }

  // función para actualizar datos de contacto
  updateProfile(data): Observable<any> {
    return this.httpClient.put<any>(`${this.operatorURL}/profile`, data).pipe(map(response => {
      return response;
    }));
  }

  changePassword(data): Observable<any> {
    return this.httpClient.put<any>(`${this.operatorURL}/profile/change-pwd`, data).pipe(map(response => {
      return response;
    }));
  }

  recoveryPws(data): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/recovery-psw`, data).pipe(map(response => {
      return response;
    }));
  }

  verifyRecTK(data): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/review-recovery-token`, data).pipe(map(response => {
      return response;
    }));
  }

  changePasswordRecTK(data): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/change-pwd-token`, data).pipe(map(response => {
      return response;
    }));
  }

  activateUserRecTK(data): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/activate-usr-token`, data).pipe(map(response => {
      return response;
    }));
  }



  // función para obtener datos de la cuenta del usuario
  loadUserData(): Observable<any> {
    return this.httpClient.get<any>(`${this.operatorURL}/profile`).pipe(map(response => {
      return response;
    }));
  }

  updateFMC(data): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/push-notifications/register`, data).pipe(map(response => {
      return response;
    }));
  }

  removeFMC(data): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/push-notifications/remove-token`, data).pipe(map(response => {
      return response;
    }));
  }



  isOnService(): Observable<any> {
    return this.httpClient.get<any>(`${this.operatorURL}/user/on-service`).pipe(map(response => {
      return response;
    }));
  }

  setFMCToken(token) {
    localStorage.setItem(this.fCMToken, token);
  }

  getFCMToken() {
    const token = localStorage.getItem(this.fCMToken);
    if (token != 'undefined') {
      return token;
    } else {
      return null;
    }
  }

  // función amigable para verificar si existe el token de sesión
  public isLogged(): boolean {
    const token = this.getToken();
    return token !== null;
  }

  setIsInService(available: boolean) {
    const _available = available ? '1' : '0';
    localStorage.setItem('isInService', _available);
    this.isOnService$.next(available);
  }


  getIsInService() {
    const data = localStorage.getItem('isInService');
    if (data || data != 'undefined') {
      this.isOnService$.next(true);
      return data;
    } else {
      this.isOnService$.next(false);
      return null;
    }
  }

  // Función para cerrar sesión, elimina lo almacenado en sessionStorage
  logout() {
   if (this.getFCMToken && this.getToken()) {
    const data =  {
      fcm_token: this.getFCMToken()
    };
    this.removeFMC(data).subscribe(res => {
      console.log(res);
    }, error => {
      console.log(error);
    });
   }


   localStorage.removeItem(this.JWToken);
   localStorage.clear();
   Network.removeAllListeners();
    // Redireccionar
   this.navigate.navigateRoot(['login']);
   clearInterval();
  }

  reloadPage() {
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
}

import { Injectable } from '@angular/core';
import {
  PushNotificationSchema,
  PushNotifications,
  Token,
  ActionPerformed,
} from '@capacitor/push-notifications';


import {map, tap} from 'rxjs/operators';
import {AlertController, AnimationController, ModalController, NavController, ToastController} from '@ionic/angular';
import {LocalNotifications} from '@capacitor/local-notifications';

import { SessionService } from './session.service';
import { ToastMessageService } from './toast-message.service';
import { SweetMessagesService } from './sweet-messages.service';
import { NotificationComponent } from '../common/modals/notification/notification.component';
import { Platform } from '@ionic/angular';
import { NotificationI } from '../interfaces/notifications/notification';
import { AudioSoundsService } from './audio-sounds.service';
import { environment } from '../../environments/environment';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import {Observable} from 'rxjs/internal/Observable';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationsService {
  token = null;
  public apiOperador = environment.OPERATOR_URL;
  public apiUrl = environment.API_URL;
  public $totalNotiUnRead = new BehaviorSubject<number>(0);


  public firebaseConfig = {
    apiKey: "AIzaSyDC6cFzzsXyhFB5aV4513jwB-JV5jhwP0g",
    authDomain: "econogruas-app.firebaseapp.com",
    projectId: "econogruas-app",
    storageBucket: "econogruas-app.appspot.com",
    messagingSenderId: "810029080064",
    appId: "1:810029080064:web:5569ff5f02452d65d6c2e5",
    measurementId: "G-V2X51M4NS9"
  };

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    public sessionServ: SessionService,
    public toastMsgSev: ToastMessageService,
    public sweetMsgServ: SweetMessagesService,
    public modalCtr: ModalController,
    public platform: Platform,
    public navigate: NavController,
    public audioServ: AudioSoundsService,
    private afMessaging: AngularFireMessaging,
    public animationCtrl: AnimationController,
    public httpClient: HttpClient,
  ) {
  }

  async showNotificationModal(notification: NotificationI) {

    const enterAnimation = (baseEl: any) => {
      const backdropAnimation = this.animationCtrl.create()
        .addElement(baseEl.querySelector('ion-backdrop')!)
        .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

      const wrapperAnimation = this.animationCtrl.create()
        .addElement(baseEl.querySelector('.modal-wrapper')!)
        .keyframes([
          { offset: 0, opacity: '0', transform: 'scale(0)' },
          { offset: 1, opacity: '0.99', transform: 'scale(1)' }
        ]);

      return this.animationCtrl.create()
        .addElement(baseEl)
        .easing('ease-out')
        .duration(500)
        .addAnimation([backdropAnimation, wrapperAnimation]);
    };

    const leaveAnimation = (baseEl: any) => {
      return enterAnimation(baseEl).direction('reverse');
    };

    const modal = await this.modalCtr.create({
      component: NotificationComponent,
      swipeToClose: true,
      cssClass: 'custom-modal-page',
      componentProps: {
        'notification': notification
      }
    });
    await modal.present();
    this.audioServ.play();
    const {data} = await modal.onWillDismiss();
  }


  async checkCapLocalNotifications() {
    let res = await LocalNotifications.checkPermissions();
    if (res.display !== 'granted') {
      this.sweetMsgServ.printWarning('NOTIFICACIONES - WARNING', 'Debe permitir que esta aplicación le envie notificaciones');
    }
  }

  // función para notificaciones con capacitor (nativo)
  initCapacitorNotifications() {

    console.log('Initializing Capacitor Notifications');

    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();

        PushNotifications.addListener(
          'registration',
          (token: Token) => {
            if (token.value) {
              if (this.sessionServ.isLogged()) {
                let data = {
                  fcm_token: token.value
                }
                this.sessionServ.updateFMC(data).subscribe(res => {
                  if (res.ok === true) {
                    console.log(res.message);
                  }
                }, error => {
                  this.toastMsgSev.presentToast(error.error.errors[0], 'Error');
                })
              }
              this.sessionServ.setFMCToken(token.value);
            }
            console.log(
              'Push registration success, token: ',
              JSON.stringify(token.value)
            );
          }
        );

        PushNotifications.addListener('registrationError', (error: any) => {
          console.log('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {

            let _notiI: NotificationI = {
              title: notification.title,
              body: notification.body,
              data: null
            };

            if (notification.data) {
              _notiI.data = notification.data;
            }

            this.showNotificationModal(_notiI);
            console.log('Push received: ', notification);
          }
        );

        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            if (notification.notification.data.url) {
              this.navigate.navigateRoot([notification.notification.data.url]);
            }
            console.log('Push action performed: ', notification);
          }
        );
      } else {
        this.toastMsgSev.presentToast('El dispositivo no soporta notificaciones push', 'Error', 'top');
        // Show some error
      }
    });
  }

  // función para notificaciones con web push pwa
  async initWebNotifications() {


    (await this.requestPermission()).subscribe(async token => {

      if (token) {
        if (this.sessionServ.isLogged()) {
          let data = {
            fcm_token: token
          }
          this.sessionServ.updateFMC(data).subscribe(res => {
            if (res.ok === true) {
              console.log(res.message);
              //this.toastMsgSev.presentToast(res.message, 'Exitoso');
            }
          }, error => {
            this.toastMsgSev.presentToast(error.error.errors[0], 'Error');
          })
        }
        this.sessionServ.setFMCToken(token);
      }

      this.getMessages().subscribe(async (msg: any) => {

        console.log('PWA Notification recived: ', msg);

          let _notiI: NotificationI = {
            title: msg.notification.title,
            body: msg.notification.body,
            data: null
          };

          if (msg.data) {
            _notiI.data = msg.data;
          }

          this.showNotificationModal(_notiI);

      })
    }, async error => {
      console.log(error);
      this.toastMsgSev.presentToast('Este navegador no soporta notificaciones push', 'Error', 'top');
    });
  }

  async requestPermission() {
    let pathWorker = '';
    if (environment.production === false) {
      pathWorker = 'firebase-messaging-sw.js';
    } else {
      pathWorker = '/econogruas/firebase-messaging-sw.js';
    }

    let finish = await navigator.serviceWorker.register(pathWorker).then(async (registration) => {
      return true;
    }).catch(e => {
      console.log('error register sw', e);
      return false;
    });

    if (finish) {
      return this.afMessaging.requestToken.pipe(
        tap(token => {
          console.log('Store token to server: ', token);
        })
      );
    } else {
      this.toastMsgSev.presentToast('Este navegador no soporta notificaciones push', 'Error', 'top');
    }
  }

  getMessages() {
    return this.afMessaging.messages;
  }

  getAll(data?): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/notifications/list`, data).pipe(map(res => {
      return res;
    }));
  }

  notificationAsRead(data): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/notifications/mark-read`, data).pipe(map(res => {
      return res;
    }));
  }

  async totalUnRead() {
    try {
      let response = await this.httpClient.get(`${this.apiUrl}/notifications/total-unread`).toPromise();
      if (response['ok']) {
        this.$totalNotiUnRead.next(response['total']);
      }
    } catch (e) {
      console.log('Error during get total unread noti -->', e);
    }
  }
}

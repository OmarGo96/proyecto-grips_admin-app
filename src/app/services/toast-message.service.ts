import { Injectable } from '@angular/core';
import {ToastController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastMessageService {

  constructor(public toastController: ToastController) { }

  async presentToast(theMessage, status?, position?) {
    const toast = await this.toastController.create({
      header: status ? status : '',
      message: theMessage,
      duration: 4000,
      color: 'dark',
      position: (position) ? position : 'bottom'
    });
    toast.present();
  }
}

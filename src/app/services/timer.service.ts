import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TimerService {

  public interval;
  public timer = 0;
  constructor(private storage: StorageService) {}

  async startTime() {
    let timerExists = await this.storage.get('timer');
    if (timerExists) {
      this.interval = setInterval(() => {
        timerExists += 1;
        this.storage.set('timer', timerExists);
      }, 1000);
    } else {
      this.interval = setInterval(() => {
        this.timer += 1;
        this.storage.set('timer', this.timer);
      }, 1000);
    }

  }

  async endTime() {
    this.timer = 0;
    await this.storage.delete('timer');
    clearInterval(this.interval);
  }

  async getLapse() {
    const timerExists = await this.storage.get('timer');
    let h;
    let m;
    let s;

    if (timerExists){
      h = Math.floor(timerExists / 3600);
      m = Math.floor(timerExists % 3600 / 60);
      s = Math.floor(timerExists % 3600 % 60);
    }else{
      h = Math.floor(this.timer / 3600);
      m = Math.floor(this.timer % 3600 / 60);
      s = Math.floor(this.timer % 3600 % 60);
    }

    return `Dias:0 Horas:${h} Minutos:${m}`;
  }
}

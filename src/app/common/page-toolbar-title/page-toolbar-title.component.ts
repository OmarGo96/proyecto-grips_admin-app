import { Component, Input, OnInit } from '@angular/core';
import { SessionService } from '../../services/session.service';
import { Location } from '@angular/common'
import {PushNotificationsService} from "../../services/push-notifications.service";
import {NavController} from "@ionic/angular";
import {GeoService} from '../../services/geo.service';

@Component({
  selector: 'app-page-toolbar-title',
  templateUrl: './page-toolbar-title.component.html',
  styleUrls: ['./page-toolbar-title.component.scss'],
})
export class PageToolbarTitleComponent implements OnInit {

  @Input() title: string;
  @Input() subtitle: string;
  @Input() hideBackBtn = false;

  public headerTitle: string;
  public headerSubtitle: string;

  constructor(
    public sessionServ: SessionService,
    private location: Location,
    public notiServ: PushNotificationsService,
    public navCtr: NavController,
    public geoServ: GeoService
  ) { }

  ngOnInit() {
    this.headerTitle = this.title || '';
    this.headerSubtitle = this.subtitle || '';
    this.getTotalUnReadNoti();
  }

  back() {
    this.location.back();
  }

  async getTotalUnReadNoti() {
    await this.notiServ.totalUnRead();
  }

  goToNotificationsList() {
    this.navCtr.navigateRoot('/notificaciones');
  }

  async handleLogout() {
    this.sessionServ.keepLookPermissions$.next(true);
    await this.geoServ.saveGeoPosition(false, true);
    this.sessionServ.logout();
  }
}

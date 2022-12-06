import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, NavController } from '@ionic/angular';

@Component({
  selector: 'app-operador-tabs',
  templateUrl: './operador-tabs.page.html',
  styleUrls: ['./operador-tabs.page.scss'],
})
export class OperadorTabsPage implements OnInit {

  @ViewChild('myTabs', {static: true}) tabs: IonTabs;
  public activeTabName: any;
  constructor(
    public router: Router,
    public navigate: NavController,
  ) { }

  ngOnInit() {
  }

  navigateTo(path) {
    this.navigate.navigateRoot([`operador/${path}`])
  }

  getSelectedTab() {
    this.activeTabName = this.tabs.getSelected();
  }

}

import { SweetMessagesService } from './../../services/sweet-messages.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { SessionService } from 'src/app/services/session.service';
import { GeneralService } from '../../services/general.service';
import {GeoService} from '../../services/geo.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: UntypedFormGroup;
  public spinner = false;
  public token: any;

  public status: string;
  constructor(
    private sessionService: SessionService,
    public navigate: NavController,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private fb: UntypedFormBuilder,
    public sweetMsg: SweetMessagesService,
    public generalServ: GeneralService,
    public geoServ: GeoService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });

    if (this.sessionService.getToken()) {
      this.navigate.navigateRoot(['operadr']);
    }
  }

  // convenience getter for easy access to form fields
  get cf() {
    return this.loginForm.controls;
  }

  ngOnInit() {}

  onSubmit() {
    this.spinner = true;

    let loginData = this.loginForm.value;
    loginData.username = String(loginData.email).trim();
    loginData.password = String(loginData.password).trim();

    let _data = {
      username: loginData.email,
      password: loginData.password
    };

    if (this.sessionService.getFCMToken() !== null) {
      _data['fcm_token'] = this.sessionService.getFCMToken();
    }

    this.sessionService.signup(_data).subscribe(
      (res) => {
        this.spinner = false;
        if (res.ok === true) {
          if (res.validateCode && res.validateCode === true) {
            this.sweetMsg.printStatus('Necesitamos verificar tu cuenta, para ello te hemos enviado un correo con instrucciones', 'warning');
            this.generalServ.verifyEmail$.next(_data.username);
            this.goToVerifyUser();
            return;
          }
          this.token = res.token;
          localStorage.setItem(this.sessionService.JWToken, this.token);
          // Verificamos si tenemos cargados los parametros de configurarción de contrario los solicitamos
          if (!this.generalServ.configParams) {
            this.generalServ.initConfigParams();
          }
          this.loginForm.reset();
          this.sweetMsg.printStatus('Bienvenido nuevamente', 'success');
          this.generalServ.initConfigParams();
          this.navigate.navigateRoot(['operador']);
        }
      },
      (error: HttpErrorResponse) => {
        console.log(error);
        this.spinner = false;
        this.loginForm.controls.password.setValue(null);
        if (error.statusText === 'Unauthorized') {
          this.sweetMsg.printStatusArray(error.error.errors, 'error');
        } else if (error.error.errors) {
          this.sweetMsg.printStatusArray(error.error.errors, 'error');
        }
        if (error.status === 500 || error.status === 404) {
          this.sweetMsg.printStatus('Error al conectar con el servidor', 'error');
        }
      }
    );
  }

  goToVerifyUser() {
    this.navigate.navigateRoot(['otp/verify-register']);
  }

  goToPwdRecovery() {
    this.navigate.navigateRoot(['otp/recovery-pwd']);
  }
}

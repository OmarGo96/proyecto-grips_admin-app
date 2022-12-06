import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { GeneralService } from '../../services/general.service';
import { SessionService } from '../../services/session.service';
import { SweetMessagesService } from '../../services/sweet-messages.service';

@Component({
  selector: 'app-recovery-account',
  templateUrl: './recovery-account.page.html',
  styleUrls: ['./recovery-account.page.scss'],
})
export class RecoveryAccountPage implements OnInit {

  public spinner = false;
  public type: string;
  public title: string;
  public otpCode: string;
  public sendBtnText: string;

  verifyEmail: string;
  public newPasswordForm: UntypedFormGroup;
  confirmPwdError: boolean;
  readonlyEmail: boolean;

  constructor(
    public navigate: NavController,
    private formBuilder: UntypedFormBuilder,
    public SessionService: SessionService,
    private sweetMsg: SweetMessagesService,
    public route: ActivatedRoute,
    public generalServ: GeneralService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {

    this.newPasswordForm = this.formBuilder.group({
      password: [null, Validators.required],
      confirm_password: [null, Validators.required]
    });

   this.route.params.subscribe(param => {
     console.log(param);
     if (param.type) {
       this.type = param.type;

       if (this.type === 'recovery-pwd') {
         this.title = 'Te estaremos enviado un código para restablecer tu contraseña al correo que tengas configurado o si ya lo tienes, ingresalo en la sección: Código de Verificación, proporciona tu correo, nueva contraseña y da click en enviar.'
         this.sendBtnText = 'Enviar';
       }

       if (this.type === 'verify-register') {
         this.title = 'Solo necesitamos verificar tu indentidad. Te hemos enviado un código al correo registrado, ingresalo en la sección: Código de Verificación y da click en verificar.'
         this.sendBtnText = 'Verificar';
         let _verifyEmail = this.generalServ.verifyEmail$.value;
         if (!_verifyEmail) {
          this.navigate.navigateRoot(['login']);
          return
         } else {
           this.verifyEmail = _verifyEmail;
           this.readonlyEmail = true;
         }
         console.log(this.generalServ.verifyEmail$.value);
       }
     }
   })
  }


  sendNewCode() {

    if (!this.verifyEmail) {
      this.sweetMsg.printStatus('Ingresa un correo para poder continuar', 'warning');
      return;
    }
    let data = {
      email: this.verifyEmail,
      audience: 2
    }
    this.generalServ.presentLoading();
    this.SessionService.recoveryPws(data).subscribe(res => {
      if (res.ok === true) {
        this.generalServ.dismissLoading();
        this.sweetMsg.printStatus(res.message, 'success');
      }
    }, error => {
      this.generalServ.dismissLoading();
      console.log(error);
      this.sweetMsg.printStatusArray(error.error.errors, 'error');
    })
  }

  verifyCode() {
    if (!this.otpCode) {
      this.sweetMsg.printStatus('Debes ingresar un código de verificación valido', 'warning');
      return;
    }
    let data = {
      token: this.otpCode
    }
    this.generalServ.presentLoading();
    this.SessionService.verifyRecTK(data).subscribe(res => {
      if (res.ok === true) {
        this.generalServ.dismissLoading();
        this.sweetMsg.printStatus('Código Correcto', 'success');
      }
    }, error => {
      this.generalServ.dismissLoading();
      console.log(error);
      this.sweetMsg.printStatusArray(error.error.errors, 'error');
    })
  }

  submit() {
    if (this.type === 'recovery-pwd') {
      this.submitChangePWD();
    }

    if (this.type === 'verify-register') {
      this.submitActivationCode();
    }
  }

  submitChangePWD() {
    if (!this.otpCode) {
      this.sweetMsg.printStatus('Debes ingresar un código de verificación valido', 'warning');
      return;
    }
    if (!this.verifyEmail) {
      this.sweetMsg.printStatus('Ingresa un correo para poder continuar', 'warning');
      return;
    }
    if (this.newPasswordForm.invalid) {
      this.newPasswordForm.markAllAsTouched();
      return;
    }
    let formData = this.newPasswordForm.value;

    if (formData.password !== formData.confirm_password) {
      this.confirmPwdError = true;
      return;
    }
    this.confirmPwdError = false;

    let data = {
      new_password: formData.password,
      verifyEmail: this.verifyEmail,
      recoveryToken: {
        token: this.otpCode
      }
    }

    this.generalServ.presentLoading();
    this.SessionService.changePasswordRecTK(data).subscribe(res => {
      if (res.ok === true) {
        this.generalServ.dismissLoading();
        this.sweetMsg.printStatus(res.message, 'success');
        this.newPasswordForm.reset();
        this.navigate.navigateRoot(['login']);
      }
    }, error => {
      this.generalServ.dismissLoading();
      console.log(error);
      this.sweetMsg.printStatusArray(error.error.errors, 'error');
    })
  }

  submitActivationCode() {
    if (!this.otpCode) {
      this.sweetMsg.printStatus('Debes ingresar un código de verificación valido', 'warning');
      return;
    }
    if (!this.verifyEmail) {
      this.sweetMsg.printStatus('Ingresa un correo para poder continuar', 'warning');
      return;
    }

    let data = {
      verifyEmail: this.verifyEmail,
      recoveryToken: {
        token: this.otpCode
      }
    }

    this.generalServ.presentLoading();
    this.SessionService.activateUserRecTK(data).subscribe(res => {
      if (res.ok === true) {
        this.generalServ.dismissLoading();
        this.sweetMsg.printStatus(res.message, 'success');
        this.newPasswordForm.reset();
        this.navigate.navigateRoot(['login']);
      }
    }, error => {
      this.generalServ.dismissLoading();
      console.log(error);
      this.sweetMsg.printStatusArray(error.error.errors, 'error');
    })
  }


  stopCarret(event) {
    if (event.target.value.length >= 3) {
      this.setCaretPosition(event, 3);
    }
  }

  setCaretPosition(event, caretPos) {
    if (event != null) {
      if (event.target.createTextRange) {
        let range = event.target.createTextRange();
        range.move('character', caretPos);
        range.select();
      } else {
        if (event.target.selectionStart) {
          event.target.focus();
          event.target.setSelectionRange(caretPos, caretPos);
        } else {
          event.target.focus();
        }
      }
    }
  }

  back() {
    this.navigate.navigateRoot(['landing'])
  }

}

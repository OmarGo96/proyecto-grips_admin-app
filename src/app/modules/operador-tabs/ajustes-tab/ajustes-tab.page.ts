import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { GeneralService } from '../../../services/general.service';
import { SessionService } from '../../../services/session.service';
import { SweetMessagesService } from '../../../services/sweet-messages.service';
import {OperatorDataI} from '../../../interfaces/operator-data';
import {GeoService} from '../../../services/geo.service';

@Component({
  selector: 'app-ajustes-tab',
  templateUrl: './ajustes-tab.page.html',
  styleUrls: ['./ajustes-tab.page.scss'],
})
export class AjustesTabPage implements OnInit {
  public isDisabled = true;

  credentialsForm: UntypedFormGroup;
  changePwdForm: UntypedFormGroup;
  contactDataForm: UntypedFormGroup;
  public userData: OperatorDataI;

  changePass = false;
  confirmPassword: string;
  passMatch: boolean;

  data = false;

  constructor(
    public sessionServ: SessionService,
    public fb: UntypedFormBuilder,
    public sweetServ: SweetMessagesService,
    public generalServ: GeneralService,
    public geoServ: GeoService
  ) {
    this.credentialsForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(80),
          Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$'),
        ],
      ],
    });

    this.changePwdForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', Validators.required],
    });

    this.contactDataForm = this.fb.group({
      name: ['', Validators.required],
      telefono: [''],
      empresa: [''],
      emailTrabajo: [''],
    });
  }
  // convenience getter for easy access to form fields
  get credentialsF() {
    return this.credentialsForm.controls;
  }
  get pwdF() {
    return this.changePwdForm.controls;
  }

  ngOnInit() {}

  ionViewWillEnter() {
    console.log('.......');
    this.data = true;
    this.loadData();
  }

  loadData() {
    this.credentialsForm.disable();
    this.credentialsForm.reset();
    this.changePwdForm.disable();
    this.changePwdForm.reset();
    this.contactDataForm.disable();
    this.contactDataForm.reset();

    this.generalServ.presentLoading();
    this.getUserProfile();
  }

  getUserProfile() {
    this.sessionServ
      .loadUserData()
      .subscribe((res) => {
        if (res.ok === true) {
          this.userData = res.profile;
        }
      })
      .add(() => {
        this.fillCredentialsForm(this.userData);
        this.fillChangePwd();
        this.fillContactDataForm(this.userData.employeeData);
        this.generalServ.dismissLoading();
      });
  }

  fillCredentialsForm(data?) {
    this.credentialsForm.setValue({
      email: data && data.login ? data.login : null,
    });
  }

  fillChangePwd(data?) {
    this.changePwdForm.setValue({
      old_password: data && data.old_password ? data.old_password : '*******',
      new_password: data && data.new_password ? data.new_password : null,
    });
  }

  fillContactDataForm(data?) {
    this.contactDataForm.setValue({
      name: data && data.name ? data.name : null,
      telefono: data && data.mobile_phone ? data.mobile_phone : null,
      emailTrabajo: data && data.work_email ? data.work_email : null,
      empresa: data && data.company_id.length > 0 ? data.company_id[1] : null,
    });
  }

  changePassword() {
    this.sweetServ
      .confirmRequest(
        'Si cambia su contraseña, será redirigido a la página de inicio de sesión para autenticarse nuevamente, proceda con cuidado'
      )
      .then((res) => {
        if (res.value) {
          this.changePass = true;
          this.pwdF.old_password.setValue(null);
          this.changePwdForm.enable();
        } else {
          this.changePass = false;
          this.changePwdForm.disable();
        }
      });
  }
  savePassword() {

    if (this.pwdF.new_password.value !== this.confirmPassword) {
      this.passMatch = false;
      return false;
    } else {
      this.passMatch = true;
      this.generalServ.presentLoading('Guardando datos...');

      this.sessionServ
        .changePassword(this.changePwdForm.value)
        .subscribe((response) => {
          if (response.ok === true) {
            this.sessionServ.logout();
            this.sweetServ.printStatus(response.message, 'success');
          }
        }, error => {
          this.sweetServ.printStatusArray(error.error.errors, 'error');
          console.log(error);
          this.cancelPassword();
          this.generalServ.dismissLoading();
        }).add(() => {
          this.generalServ.dismissLoading();
        });
    }
  }
  cancelPassword() {
    this.passMatch = null;
    this.confirmPassword = null;
    this.changePass = false;
    this.fillChangePwd();
    this.changePwdForm.disable();
  }

  ionViewWillLeave() {
    this.changePass = false;
    this.confirmPassword = null;
    this.passMatch = null;
    this.data = false;
    this.fillCredentialsForm();
  }
}

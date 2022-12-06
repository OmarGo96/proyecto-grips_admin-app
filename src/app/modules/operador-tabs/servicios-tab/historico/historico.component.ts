import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Solicitud } from '../../../../interfaces/solicitud';
import { GeneralService } from '../../../../services/general.service';
import { SessionService } from '../../../../services/session.service';
import { SweetMessagesService } from '../../../../services/sweet-messages.service';
import { ToastMessageService } from '../../../../services/toast-message.service';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.scss'],
})
export class HistoricoComponent implements OnInit, OnChanges {

  @Input() solicitudes: Solicitud[];
  public loadingInit = false;

  constructor(
    public generalServ: GeneralService,
    public sessionServ: SessionService,
    public sweetMsg: SweetMessagesService,
    public toast: ToastMessageService,
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    let solicitudChange = changes.solicitudes;
    if (solicitudChange.firstChange === false || solicitudChange.isFirstChange() === true) {
      if (this.solicitudes) {
      }
    }
  }
}

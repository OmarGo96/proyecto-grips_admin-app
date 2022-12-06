import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {PreSolicitudI} from "../../../interfaces/pre-solicitud/pre-solicitud.interface";
import {DateConv} from "../../../helpers/date-conv";
import {PreSolStatusC} from "../../../enums/pre-sol-status.enum";
import {MatPaginator} from "@angular/material/paginator";
import {BehaviorSubject} from "rxjs";
import {MatTableDataSource} from "@angular/material/table";
import {GeneralService} from "../../../services/general.service";


@Component({
  selector: 'app-pre-solicitud-card-resume',
  templateUrl: './pre-solicitud-card-resume.component.html',
  styleUrls: ['./pre-solicitud-card-resume.component.scss'],
})
export class PreSolicitudCardResumeComponent implements OnInit, OnDestroy {

  @Input() preSolicitudes: PreSolicitudI[];
  dateHelper = DateConv;
  preSolStatus = PreSolStatusC;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  obs: BehaviorSubject<any>;
  dataSource: MatTableDataSource<PreSolicitudI>;
  constructor(
    public generalServ: GeneralService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.changeDetectorRef.detectChanges();
    if (this.preSolicitudes) {
      this.dataSource = new MatTableDataSource<PreSolicitudI>(this.preSolicitudes);
      this.dataSource.paginator = this.paginator;
      this.obs = this.dataSource.connect();
    }
  }

  ngOnDestroy() {
    if (this.dataSource) {
      this.dataSource.disconnect();
    }
  }
}

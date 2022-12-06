import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { Component } from '@angular/core';
import SignaturePad from 'signature_pad';
import { Signature } from 'src/app/interfaces/signature';
import {SweetMessagesService} from '../../../services/sweet-messages.service';


@Component({
  selector: 'app-signature-capture',
  templateUrl: './signature-capture.component.html',
  styleUrls: ['./signature-capture.component.scss']
})
export class SignatureCaptureComponent implements AfterViewInit, AfterViewChecked {

  //#region ATTRIBUTES
  @ViewChild('canvas1', { static: false }) signaturePadElement1;
  public captureSignatureLabel: string;
  signaturePad1: any;
  public isSmallDivice: boolean;
  @Output() signatureEmit = new EventEmitter();
  @Output() signatureRefresh = new EventEmitter();
  public signatureCaptured: Signature;
  @Input() instanceType: 'accordion' | 'plain' = 'accordion';
  @Input() customer_sign: any;

  showCanva = true;
  //#endregion

  constructor(
    private messageService: SweetMessagesService,
    private cdRef: ChangeDetectorRef,
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.window.innerWidth <= 1024) {
      this.isSmallDivice = true;
    } else {
      this.isSmallDivice = false;
    }
    if (event.target.window.innerWidth <= 768) {
      setTimeout(() => {
        this.initSignature();
      }, 1000);
    } else {
      setTimeout(() => {
        this.initSignature();
      }, 1000);
    }
  }

  ngAfterViewInit(): void {
    this.initSignature(true);
    if (this.customer_sign) {
      this.showCanva = false;
    }
  }

  ngAfterViewChecked(): void {
    this.cdRef.detectChanges();
  }
  //#region SIGNATURE FUNCTIONS

  // Función para inicializar firma
  initSignature(firstTime?: boolean) {
    // this.signaturePad1 = null;
    if (!this.signaturePad1) {
      //let timeOut = (firstTime && firstTime === true) ? 1000 : 0;
      let timeOut = 0;
      setTimeout(() => {
        this.signaturePad1 = new SignaturePad(this.signaturePadElement1.nativeElement);
        this.signaturePad1.clear();
        this.signaturePad1.penColor = 'rgb(0,0,0)';

        const canvas: any = document.getElementById('canva-signature1') as HTMLCanvasElement;
        const modalPadding = 24;

        let _with = document.getElementById('signature-container1').offsetWidth;
        if (_with === 0) {
          canvas.width = 300;
        } else {
          canvas.width = _with;
        }

        console.log('clear signature', _with);
        this.signaturePad1.clear();

        this.signaturePad1.onEnd = () => {
          this.emitSignature();
        };
      }, timeOut);
    }
  }


  clear() {
    if (!this.signaturePad1) {
      this.initSignature();
    }
    this.signaturePad1.clear();
    this.signatureRefresh.emit();
  }

  undo() {
    const data = this.signaturePad1.toData();
    if (data) {
      data.pop();
      this.signaturePad1.fromData(data);
      console.log(data.length);
      if (data.length === 0) {
        console.log('no data');
        this.signatureRefresh.emit();
      }
    }
  }

  newSign() {
    this.messageService.confirmRequest('Al capturar nuevamente la firma se borrara la anterior. ¿Estás seguro de continuar?').then((data) => {
      if (data.value) {
        this.showCanva = true;
      }
    });
  }

  cancelSign() {
    this.showCanva = false;
  }

  emitSignature() {
    let img;
    let metaData;
    img = this.signaturePad1.toDataURL();
    metaData = this.signaturePad1.toData();

    // emitimos datos al componente padre
    this.signatureCaptured = {
      signature_matrix: metaData,
      signature_img: img
    }

    this.signatureEmit.emit(this.signatureCaptured);
  }
  //#endregion

}

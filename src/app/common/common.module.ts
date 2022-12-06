import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PageToolbarTitleComponent } from './page-toolbar-title/page-toolbar-title.component';
import { GoogleMapsComponent } from './google-maps/google-maps.component';
import { NotificationComponent } from './modals/notification/notification.component';
import { CameraComponent } from './camera/camera.component';
import { MaterialModule } from '../material/material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { WireTransferDataComponent } from './modals/wire-transfer-data/wire-transfer-data.component';
import { DocsViewerComponent } from './docs-viewer/docs-viewer.component';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import {ServiceDetailsComponent} from './components/service-details/service-details.component';
import {SignatureCaptureComponent} from './components/signature-capture/signature-capture.component';
import {ViewNotificationComponent} from './modals/view-notification/view-notification.component';
import {TimecounterBarComponent} from './components/timecounter-bar/timecounter-bar.component';
import {PreSolicitudCardResumeComponent} from './components/pre-solicitud-card-resume/pre-solicitud-card-resume.component';
import { PhotoModalComponent } from './modals/photo-modal/photo-modal.component';
import {ReloadButtonComponent} from './components/reload-button/reload-button.component';



@NgModule({
    declarations: [
        PageToolbarTitleComponent,
        GoogleMapsComponent,
        NotificationComponent,
        CameraComponent,
        WireTransferDataComponent,
        DocsViewerComponent,
        ServiceDetailsComponent,
        SignatureCaptureComponent,
        ViewNotificationComponent,
        TimecounterBarComponent,
        PreSolicitudCardResumeComponent,
        PhotoModalComponent,
        ReloadButtonComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        RouterModule,
        MaterialModule,
        ReactiveFormsModule,
        PdfJsViewerModule,
        FormsModule
    ],
    exports: [
        PageToolbarTitleComponent,
        GoogleMapsComponent,
        NotificationComponent,
        CameraComponent,
        WireTransferDataComponent,
        DocsViewerComponent,
        ServiceDetailsComponent,
        SignatureCaptureComponent,
        ViewNotificationComponent,
        TimecounterBarComponent,
        PreSolicitudCardResumeComponent,
        PhotoModalComponent,
        ReloadButtonComponent
    ]
})
export class AppCommonModule { }

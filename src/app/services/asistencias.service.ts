import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AsistenciasService {

   //#region Atributos
   public apiOperator = environment.OPERATOR_URL;
   //#endregion


   constructor(
     public httpClient: HttpClient,
     public router: Router
   ) { }

   //#region Métodos

    listAssistenceReq(data): Observable<any> {
      return this.httpClient.post<any>(`${this.apiOperator}/solicitudes/list`, data).pipe(map(response => {
        return response;
      }));
    }

    listAssistenceReq2(data) {
      return this.httpClient.post<any>(`${this.apiOperator}/solicitudes/list`, data);
    }

    getPaymentTicket(data): Observable<any> {
      return this.httpClient.post(`${this.apiOperator}/solicitudes/get-ticket`, data, {responseType: 'blob'});
    }

    async getPreSolicitudes(data) {
      try {
        return await this.httpClient.post(`${this.apiOperator}/pre-solicitudes/new`, data).toPromise();
      } catch (e) {
        return {ok: false, errors: e};
      }

    }

    getPreSolicitudesFiles(data) {
     return this.httpClient.post(`${this.apiOperator}/pre-solicitudes/files`, data).toPromise();
    }

    async getActiveSols(data?) {
       try {
         return await this.httpClient.get(`${this.apiOperator}/pre-solicitudes/inprogress`, data).toPromise();
       } catch (e) {
         return { ok: false };
       }
    }

    async attendPreSolicitudes(data) {
      return await this.httpClient.post(`${this.apiOperator}/pre-solicitudes/attend`, data).toPromise();
    }

    async changeStatus(data) {
     try {
       const query = await this.httpClient.post(`${this.apiOperator}/solicitudes/changeStatus`, data).toPromise();
       return { ok: true, data: query };
     } catch (e) {
       return {ok: false};
     }
    }

   //#endregion
}

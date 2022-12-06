import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class PreSolicitudesService {

  //#region Atributos
  public apiOperator = environment.OPERATOR_URL;
  //#endregion


  constructor(
    public httpClient: HttpClient,
    public router: Router
  ) { }

  getPreSolData(idPreSol): Observable<any> {
    return this.httpClient.get<any>(`${this.apiOperator}/pre-solicitud/${idPreSol}`).pipe(map(res => {
      return res;
    }));
  }

  getSolicitud(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this.apiOperator}/solicitudes/list`, data).pipe(map(res => {
      return res;
    }));
  }

  getPreSolFiles(data): Observable<any> {
    return this.httpClient.post(`${this.apiOperator}/pre-solicitudes/files`, data, {responseType: 'blob'});
  }

  async getPartnerDocs(data: any) {
    try {
      const response: any = await this.httpClient.post(`${this.apiOperator}/solicitudes/getPartnerDocs`, data).toPromise();
      console.log('response form server', response);
      if (response.ok) {
        return { ok: true, data: response.data};
      } else {
        return { ok: false };
      }
    } catch (e) {
      return { ok: false };
    }
  }

  async deletePartnerDocs(data: any) {
    try {
      const response: any = await this.httpClient.post(`${this.apiOperator}/solicitudes/unLinkDocs`, data).toPromise();
      console.log('response form server', response);
      if (response.ok) {
        return { ok: true, data: response.data};
      } else {
        return { ok: false };
      }
    } catch (e) {
      return { ok: false };
    }
  }

  async updateSolInfo(data: any){
    try {
      const response: any = await this.httpClient.post(`${this.apiOperator}/solicitutes/update-plate-serie`, data).toPromise();
      console.log('response form server', response);
      if (response.ok) {
        return { ok: true, data: response.data};
      } else {
        return { ok: false };
      }
    }catch (e) {
      return {ok: false};
    }
  }

  async uploadPicture(payload: any){
    try {
      const response: any = await this.httpClient.post(`${this.apiOperator}/solicitudes/savePartnerDocs`, payload).toPromise();
      console.log('response from server', response);
      if (response.ok) {
        return { ok: true, data: response.data};
      }
    } catch (e) {
      return { ok: false };
    }
  }

  getPreSolSection(data) {
    return this.httpClient.post<any>(`${this.apiOperator}/pre-solicitudes/get`, data);
  }

  async canSign(data) {
    try {
      const query: any = await this.httpClient.post(`${this.apiOperator}/solicitudes/can-sign`, data).toPromise();
      if (query.ok) {
        return {ok: true, data: query.data};
      } else {
        return {ok: false, error: query.error};
      }
    } catch (e) {
      return {ok: false, error: e};
    }
  }

  async saveSignatureAndFinish(data) {
    try {
      const query: any = await this.httpClient.post(`${this.apiOperator}/solicitudes/capture-signature-finish`, data).toPromise();
      if (query.ok) {
        return { ok: true, data: query.data };
      } else {
        return { ok: false };
      }
    } catch (e) {
      return { ok: false };
    }
  }
}

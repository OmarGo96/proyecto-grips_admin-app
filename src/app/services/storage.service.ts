import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) { }

  async init() {
    console.log('storage service online');
    // If using, define drivers here: await this.storage.defineDriver(/*...*/);
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Create and expose methods that users of this service can
  // call, for example:
  public set(key: string, value: any) {
    this._storage?.set(key, value);
  }
   // Return key
  async get(key: string) {
    return await this._storage?.get(key);
  }

  async delete(key: string) {
    await this._storage.remove(key);
  }

  async clear() {
    await this.storage.clear();
  }
}

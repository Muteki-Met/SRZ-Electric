import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectorConfigService {
  // Numero di connettori (minimo 3, massimo 8)
  private connectorsCountSubject = new BehaviorSubject<number>(8); // Default: 4
  connectorsCount$ = this.connectorsCountSubject.asObservable();

  // Metodo per aggiornare il numero di connettori
  setConnectorsCount(count: number): void {
    if (count >= 3 && count <= 8) {
      this.connectorsCountSubject.next(count);
    } else {
      console.error('Il numero di connettori deve essere compreso tra 3 e 8.');
    }
  }
}

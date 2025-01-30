import { Injectable } from '@angular/core';
import { Room } from '../models/room.model';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RoomServiceService {

  constructor(
    private readonly _http: HttpClient
  ) { }

  public getRooms(): Observable<Room[]> {
    return this._http.get<Room[]>('http://localhost:3000/rooms');
  }

  public existsUser(username: string): Observable<any> {
    return this._http.get(`http://localhost:3000/rooms/user-exists/${username}`);
  }


}

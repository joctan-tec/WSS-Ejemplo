import { EventEmitter, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Room } from '../models/room.model';
// import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class SocketServiceService {
  private io?: Socket;

  public readonly _newNotification: EventEmitter<{ message: string, date: Date }> = new EventEmitter();
  public readonly _roomCreated: EventEmitter<Room[]> = new EventEmitter<Room[]>();

  constructor(
  ) {
  }

  public connect() {
    if (!this.io) {
      console.log('Connecting');
      this.io = io('http://localhost:3000');
      console.log('Connected');

      this.io.on('GENERAL_NOTIFICATION', (notification) => {
        this._newNotification.emit(notification);
      });

      this.io.on('ROOM_CREATED', (room) => {
        this._roomCreated.emit(room);
      });
    }

  }



  public get newNotification() {
    return this._newNotification;
  }

  public get roomCreated() {
    return this._roomCreated;
  }

  public createRoom(name: string) {
    this.io?.emit('CREATE_ROOM', JSON.stringify({ name }));
  }
  


}

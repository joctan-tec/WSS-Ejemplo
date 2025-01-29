import { EventEmitter, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class SocketServiceService {
  private io?: Socket;

  // Event emitters
  public readonly _newNotification: EventEmitter<{ message: string, date: Date }> = new EventEmitter();
  public readonly _roomCreated: EventEmitter<Room[]> = new EventEmitter<Room[]>();
  public readonly _userJoinedRoom: EventEmitter<boolean> = new EventEmitter();

  constructor() { }

  // Método de conexión al socket
  public connect(username: string) {
    if (!this.io) {
      console.log('Connecting...');
      this.io = io('http://localhost:3000');
      console.log('Connected');

      // Emitir evento para asignar el usuario al socket
      this.io.emit('ASSIGN_USER', JSON.stringify({ username }));

      // Escuchar las notificaciones generales
      this.io.on('GENERAL_NOTIFICATION', (notification) => {
        this._newNotification.emit(notification);
      });

      // Escuchar cuando se crea una sala
      this.io.on('ROOM_CREATED', (room) => {
        this._roomCreated.emit(room);
      });

      // Escuchar cuando un usuario se une a una sala
      this.io.on('USER_JOINED_ROOM', (success: boolean) => {
        this._userJoinedRoom.emit(success);
      });
    }
  }

  // Métodos para acceder a los eventos
  public get newNotification() {
    return this._newNotification;
  }

  public get roomCreated() {
    return this._roomCreated;
  }

  public get userJoinedRoom() {
    return this._userJoinedRoom;
  }

  // Métodos para emitir acciones
  public createRoom(name: string) {
    this.io?.emit('CREATE_ROOM', JSON.stringify({ name }));
  }

  public joinRoom(room: string, username: string) {
    this.io?.emit('JOIN_ROOM', JSON.stringify({ room, username }));
  }


}

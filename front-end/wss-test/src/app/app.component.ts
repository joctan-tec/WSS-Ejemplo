import { AfterViewChecked, AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SocketServiceService } from './services/socket-service.service';
import { RoomServiceService } from './services/room-service.service';
import { Observable, of } from 'rxjs';
import { MessageType, PictochatMessage, Room } from './models/room.model';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from "@angular/forms"
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatButtonModule, FormsModule, MatInput, MatFormFieldModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  rooms: Room[] = [];
  currentRoom?: Room;
  status = false;
  message = '';
  username = 'Juan';
  public joinSuccess: boolean | null = null;

  notifications: { message: string, date: Date }[] = []

  constructor(
    private readonly socketService: SocketServiceService,
    private readonly _roomService: RoomServiceService
  ) {
    this._roomService.getRooms().subscribe((rooms) => {
      this.rooms = rooms;
    });
  }

  ngOnInit(): void {}

  sendMessage() {
    console.log('Sending message');
  }

  createRoom() {
    const roomName = prompt('Enter the room name: ');
    if (roomName) {
      this.socketService.createRoom(roomName);
    }
  }

  onLeaveRoom() {
    this.currentRoom = undefined;
  }


  public onSelectRoom(room: Room) {
    if (this.currentRoom && this.currentRoom.name === room.name) {
      // Si ya estás en la sala, no hacer nada
      return;
    }

    if (this.currentRoom) {
      // Si ya hay una sala actual, salimos de esa sala
      //llamar a salir de la sala;
    }

    // Establecer la sala actual
    this.currentRoom=room;
    this.socketService.joinRoom( this.currentRoom!.name, this.username); // Unirse a la nueva sala
  }

  public getMessageClass(message: PictochatMessage) {
    if (message.messageType === MessageType.notification) {
      return ['justify-center rounded-lg bg-emerald-700 p-2 text-white mb-3'];
    }
    return [];
  }

  public connect() {

    const username = prompt('Por favor, ingresa tu nombre:');
    if(username){
      this._roomService.existsUser(username).subscribe((exists) => {
        console.log(exists);
        if (exists.exists) {
          alert('El usuario ya existe');
          return;
        }

        this.username=username
      this.socketService.connect(this.username);
      this.status = true;
      

      this.socketService.newNotification.subscribe((notification) => {
        this.notifications.push(notification);
      });

      this.socketService.roomCreated.subscribe((room: Room) => {
        this.rooms.push(room);
      });

      this.socketService.userJoinedRoom.subscribe((success: boolean) => {
        this.joinSuccess = success;  // Actualizar el estado de la unión
      });

      this.socketService._roomsUpdated.subscribe((rooms: Room[]) => {
        this.rooms = rooms;
        this.currentRoom = rooms.find((room) => room.name === this.currentRoom?.name);
      });

      });

      
      
    }
  }

  title = 'wss-test-2';
}

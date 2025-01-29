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
import {MatIconModule} from '@angular/material/icon';


export enum RequestsTopics {
  ASSIGN_USER = 'ASSIGN_USER',
  JOIN_ROOM = 'JOIN_ROOM',
  CREATE_ROOM = 'CREATE_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  NEW_MESSAGE = 'NEW_MESSAGE'
}

export enum GeneralGroups {
  GENERAL_NOTIFICATIONS = 'GENERAL_NOTIFICATIONS'
}

export enum TopicsToSend {
  GENERAL_NOTIFICAITON = 'GENERAL_NOTIFICATION',
  ROOM_CREATED = 'ROOM_CREATED'
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatButtonModule, FormsModule, MatInput, MatFormFieldModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  rooms: Room[] = [];
  currentRoom?: Room;
  status = false;
  message = '';	

  notifications: { message: string, date: Date }[] = []

  public constructor(
    private readonly socketService: SocketServiceService,
    private readonly _roomService: RoomServiceService
  ) {
    this._roomService.getRooms().subscribe((rooms) => {
      this.rooms = rooms;
    });
  }

  ngOnInit(): void {
    
  }

  sendMessage(){
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
    this.currentRoom = this.currentRoom === undefined || this.currentRoom.name !== room.name
      ? room
      : undefined;
  }

  public getMessageClass(message: PictochatMessage) {
    if (message.messageType === MessageType.notification) {
      return ['justify-center rounded-lg bg-emerald-700 p-2 text-white mb-3'];
    }
    return [];
  }

  public connect() {

    this.socketService.connect();
    this.status = true;

    this.socketService.newNotification.subscribe((notification) => {
      this.notifications.push(notification);
    });

    this.socketService.roomCreated.subscribe((room: Room) => {
      this.rooms.push(room);
    });

    
  }


  title = 'wss-test-2';
}

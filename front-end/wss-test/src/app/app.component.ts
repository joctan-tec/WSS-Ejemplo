import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  username = '';
  public joinSuccess: boolean | null = null;
  public leaveSuccess: boolean | null = null;

  notifications: { message: string, date: Date }[] = []

  constructor(
    private readonly socketService: SocketServiceService,
    private readonly _roomService: RoomServiceService
  ) {
  }

  ngOnInit(): void {}

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error en autoscroll:', err);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (!this.message) {
      return;
    }
    this.socketService.sendNewMessage(this.message, this.username);
    this.message = '';
  }

  createRoom() {
    const roomName = prompt('Enter the room name: ');
    if (roomName) {
      this.socketService.createRoom(roomName);
    }
  }

  async onLeaveRoom(): Promise<void> {
    if (this.currentRoom) {
      await this.socketService.leaveRoom(this.username); // Asegurar que leaveRoom termine
      console.log('Leaving room');
      this.currentRoom = undefined;
    }
  }
  
  public async onSelectRoom(room: Room): Promise<void> {
    if (this.currentRoom && this.currentRoom.name === room.name) {
      return; // Ya estás en la misma sala, no hacer nada
    }
  
    if (this.currentRoom) {
      await this.onLeaveRoom(); // Esperar a que se complete leaveRoom
    }
  
    // Establecer la nueva sala
    this.currentRoom = room;
    this.socketService.joinRoom(this.currentRoom!.name, this.username); // Unirse a la nueva sala
  }
  



  public getMessageClass(message: PictochatMessage) {
    if (message.messageType === MessageType.notification) {
      return ['justify-center', 'bg-sky-600', 'text-white'];
    }
    if (message.sentBy?.username === this.username) {
      return ['bg-emerald-400', 'text-white'];
    }else{
      return ['bg-gray-400', 'text-white'];
    }
    
  }

  public manageConnectButton() {
    if (this.status) {
      this.disconnect();
    } else {
      this.connect();
    }
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

      this.socketService.userJoinedRoom.subscribe((notification) => {
        this.notifications.push(notification);
      });

      this.socketService._roomsUpdated.subscribe((rooms: Room[]) => {
        this.rooms = rooms;
        this.currentRoom = rooms.find((room) => room.name === this.currentRoom?.name);
      });

      this.socketService._newMessages.subscribe((message: PictochatMessage) => {
        if (this.currentRoom && message.sentBy && this.currentRoom.name === message.sentBy.currentRoom) {
          this.currentRoom.messageHistory.push(message);
        }
      });

      this.socketService.userLeftRoom.subscribe((username) => {
        this.leaveSuccess = true;
      });

      this._roomService.getRooms().subscribe((rooms) => {
        this.rooms = rooms;
      });


      });


      
      
    }
  }

  public disconnect() {
    this.socketService.disconnect();
    this.status = false;
    this.currentRoom = undefined;
    this.notifications = [];
    this.rooms = [];
    this.username = '';
    
  }

  title = 'wss-test-2';
}

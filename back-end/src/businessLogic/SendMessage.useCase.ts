import { UserRepository} from './../database/user.database';
import { Socket } from "socket.io";
import { PictochatMessage } from "../domain/message/message.model";
import { MessageType } from "../domain/message/messageType.enum";
import { Room } from '../domain/room/room.model';
import { RoomRepository } from '../database/room.repository';

export type SendMessageCommand = {
  content: string;
  username: string;
};

export type SendMessageResult = {
  message?: PictochatMessage;
  success: boolean;
};

export class SendMessageUseCase {
  private socket:Socket;
  private userRepository:UserRepository;
  private roomRepository: RoomRepository;

  public constructor(socket:Socket,UserRepository:UserRepository, romRepository: RoomRepository) 
  { 
    this.socket=socket;
    this.userRepository=UserRepository;
    this.roomRepository=romRepository;
  }

  public handle(command: SendMessageCommand): SendMessageResult {
    const user = this.userRepository.getUsers().find((user) => user.username === command.username);
    if (!user) {
      throw new Error('User not found');
    }

    const room = this.roomRepository.getRoomByName(user.currentRoom??"");
    if (!room) {
      throw new Error('Room not found');
    }

    const message: PictochatMessage = {
      messageType: MessageType.direct_message,
      content: command.content,
      sent: new Date(),
      sentBy: user
    };
    room.messageHistory.push(message);
    this.socket.broadcast.emit('ROOMS_UPDATED', this.roomRepository.getRooms());
    this.socket.emit('ROOMS_UPDATED', this.roomRepository.getRooms());
    
    return { success: true };
  }
}
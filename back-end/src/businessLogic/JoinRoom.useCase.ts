import { Socket } from "socket.io";
import { UserRepository } from "../database/user.database";
import { PictochatMessage } from "../domain/message/message.model";
import { MessageType } from "../domain/message/messageType.enum";
import { TopicsToSend } from "../constants";
import { RoomRepository } from "../database/room.repository";

export type JoinRoomCommand = {
  username: string;
  room: string;
};

export type JoinRoomResult = {
  success: boolean;
};

export class JoinRoomHandler {
  public constructor(
    private readonly _socket: Socket,
    private readonly _userRepository: UserRepository,
    private readonly _roomRepository: RoomRepository
  ) { }

  public handle(command: JoinRoomCommand): JoinRoomResult {
    console.log('JoinRoomHandler', command)
    if (!command.username || !command.room) {
      return { success: false };
    }

    const user = this._userRepository.getUsers().find((user) => user.username === command.username);
    if (!user) {
      return { success: false };
    }

    try {
      
      const room = this._roomRepository.getRoomByName(command.room);
      if (!room) {
        return { success: false };
      }
      this._socket.join(command.room);
      user.currentRoom = command.room;

      // Actualizar la sala actual del usuario
      user.currentRoom = command.room;
      
      // Incrementar el número de participantes en la sala
      room.numberOfParticipants++;

      
    
      // Emitir el evento a todos los usuarios en la sala (y al mismo usuario)
      this._socket.to(command.room).emit("USER_JOINED_ROOM", {
        message: `${command.username} se ha unido a la sala`,
        date: new Date(),
      });
      this._socket.emit("USER_JOINED_ROOM", {
        message: `Te has unido a la sala ${command.room}`,
        date: new Date(),
      });  // Emitir al propio usuario

      // Agregar mensaje al historial de mensajes de la sala
      const message: PictochatMessage = {
        content: `${user.username} se ha unido a la sala`,
        messageType: MessageType.notification,
        sent: new Date(),
        sentBy: user,
      };

      room.messageHistory.push(message);

      this._socket.broadcast.emit('ROOMS_UPDATED', this._roomRepository.getRooms());
      this._socket.emit('ROOMS_UPDATED', this._roomRepository.getRooms());


      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }


  }
}

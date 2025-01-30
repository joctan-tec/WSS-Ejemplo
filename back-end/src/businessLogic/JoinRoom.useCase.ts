import { Socket } from "socket.io";
import { UserRepository } from "../database/user.database";
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
      this._socket.join(command.room)
      const room = this._roomRepository.getRoomByName(command.room);
      if (!room) {
        return { success: false };
      }

      // Actualizar la sala actual del usuario
      user.currentRoom = command.room;
      
      // Incrementar el número de participantes en la sala
      room.numberOfParticipants++;

      this._socket.broadcast.emit('ROOMS_UPDATED', this._roomRepository.getRooms());
      this._socket.emit('ROOMS_UPDATED', this._roomRepository.getRooms());
    
      // Emitir el evento a todos los usuarios en la sala (y al mismo usuario)
      this._socket.to(command.room).emit("USER_JOINED_ROOM", true);
      this._socket.emit("USER_JOINED_ROOM", true);  // Emitir al propio usuario
      
      // Enviar una notificación general
      this._socket.emit(TopicsToSend.GENERAL_NOTIFICAITON, {
        message: `User ${command.username} joined room ${command.room}`,
        date: new Date(),
      });
      this._socket.to(command.room).emit('NEW_MESSAGES', {message: 'User has joined the room', username: command.username})

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }


  }
}

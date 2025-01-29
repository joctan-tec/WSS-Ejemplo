import { Socket } from "socket.io";
import { UserRepository } from "../database/user.database";
import { TopicsToSend } from "../constants";

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

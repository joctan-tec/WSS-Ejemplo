import { Socket } from "socket.io";
import { UserRepository } from "../database/user.database";
import { RoomRepository } from "../database/room.repository";
import { TopicsToSend } from "../constants";

export type LeaveRoomCommand = {
  username: string;
};

export type LeaveRoomResult = {
  success: boolean;
};

export class LeaveRoomHandler {
  public constructor(
    private readonly _socket: Socket,
    private readonly _userRepository: UserRepository,
    private readonly _roomRepository: RoomRepository,
  ) {
  }

  public handle(command: LeaveRoomCommand): LeaveRoomResult {
    const { username }  = command;
    
    //Obtener usuario
    const user = this._userRepository.getUsers().find((user) => user.username === command.username);
    
    //Validar el usuario exista
    if (!user || !user.currentRoom){ 
      return { success: false };
    }

    //Obtener la sala
    const room = this._roomRepository.getRoomByName(user.currentRoom!);
    

    // Validar que la room exista
    if (!room){
      return { success: false };
    }
    
    // Guardar el nombre de la sala del usuario antes de limpiarlo
    const roomName = user.currentRoom; 
    
    // Quitarle un participante a la sala
    room.numberOfParticipants --;

    //Implementar la logica de salir de la sala
    this._socket.leave(user.currentRoom!);

    // Actualizar el usuario
    user.currentRoom = undefined;

    // Emitir el evento a todos los usuarios en la sala (y al mismo usuario)
    this._socket.to(roomName!).emit('USER_LEFT', user.username);
    this._socket.emit('USER_LEFT', user.username);


    // Enviar una notificación general
    this._socket.to(roomName!).emit(TopicsToSend.GENERAL_NOTIFICAITON, {
      message: `User ${username} left room ${roomName}`,
      date: new Date(),
    });
    this._socket.emit(TopicsToSend.GENERAL_NOTIFICAITON, {
      message: `User ${username} left room ${roomName}`,
      date: new Date(),
    });

    // Actualizar las salas
    this._socket.broadcast.emit('ROOMS_UPDATED', this._roomRepository.getRooms());
    this._socket.emit('ROOMS_UPDATED', this._roomRepository.getRooms());

    return { success: true };
  }
}

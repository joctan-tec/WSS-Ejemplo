import { Socket } from "socket.io";
import { RoomRepository } from "../database/room.repository";
import { Room } from "../domain/room/room.model";
import { TopicsToSend } from "../constants";
import { MessageType } from "../domain/message/messageType.enum";

export type CreateRoomCommand = {
  name: string;
};

export type CreateRoomResult = {
  room?: Room;
};

export class CreateRoomHandler {
  public constructor(
    private readonly _socket: Socket,
    private readonly _roomRepository: RoomRepository
  ) {}

  public handle(command: CreateRoomCommand): CreateRoomResult {
    // Extract the name from the command
    const { name } = command;
    // Get the existing room names
    const existingRooms = this._roomRepository
      .getRooms()
      .map((room) => room.name);

    // Check if the name is empty or already exists
    if (!name || existingRooms.includes(name)) {
      console.log("Room name is empty or already exists");
      return {};
    }

    // Create a new room with the given name
    const room: Room = {
      name,
      numberOfParticipants: 0,
      messageHistory: [
        {
          content: `Grupo ${name} creado`,
          messageType: MessageType.notification,
          sent: new Date(),
        },
      ],
    };
    this._roomRepository.addRoom(room);

    // Notify the client that the room was created
    this._socket.emit(TopicsToSend.GENERAL_NOTIFICAITON, {
      message: `Room created: ${room.name}`,
      date: new Date(),
    });

    this._socket.emit(TopicsToSend.ROOM_CREATED, room);
    this._socket.emit('ROOMS_UPDATED', this._roomRepository.getRooms());
    this._socket.broadcast.emit('ROOMS_UPDATED', this._roomRepository.getRooms());

    return { room };
  }
}

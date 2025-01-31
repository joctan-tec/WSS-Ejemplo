import express, { Express } from 'express';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';
import { cors } from './httpServer/cors.function';
import { UserRepository } from './database/user.database';
import { RoomRepository } from './database/room.repository';
import { Startup } from './loadInitialData';
import { SendMessageUseCase } from './businessLogic/SendMessage.useCase';
import { JoinRoomHandler } from './businessLogic/JoinRoom.useCase';
import { LeaveRoomHandler } from './businessLogic/LeaveRoom.useCase';
import { CreateRoomHandler } from './businessLogic/CreateRoom.useCase';
import { GeneralGroups, RequestsTopics, TopicsToSend } from './constants';
import { PictochatUser } from './domain/user/user.model';

// Routes
import RoomsRoute from './routes/room.routes';

const PORT = 3000;
// const origin:

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors);

// Startup
Startup();

app.use('/rooms', RoomsRoute);


// Setup http server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});



io.on('connection', (socket: Socket) => {
  const { id } = socket;

  console.log(`Connected ${id}`);
  socket.join(GeneralGroups.GENERAL_NOTIFICATIONS);

  socket.on('USER_DISCONNECT', () => {
    const userRepository = new UserRepository();
    const roomRepository = new RoomRepository();
    console.log(`User requested disconnection: ${socket.id}`);
  
    const user = userRepository.getUsers().find((u) => u.socketId === socket.id);
    if (user) {
      const room = roomRepository.getRooms().find((r) => r.name === user.currentRoom);
      if (room) {
        room.numberOfParticipants -= 1;
        socket.leave(room.name); // Asegurar que abandona la sala
        socket.broadcast.emit('ROOMS_UPDATED', roomRepository.getRooms());
      }
      
    }
  
    socket.disconnect();
  });
  


  socket.on(RequestsTopics.ASSIGN_USER, (createUserRequest) => {
    const userRepository = new UserRepository();
    const user: PictochatUser = {
      socketId: socket.id,
      username: JSON.parse(createUserRequest).username
    };
    userRepository.addUser(user);
  });

  socket.on(RequestsTopics.CREATE_ROOM, (createRoomRequest) => {
    const roomRepository = new RoomRepository();
    const createRoomHandler = new CreateRoomHandler(socket, roomRepository);
    createRoomHandler.handle({ name: JSON.parse(createRoomRequest).name });
  });

  socket.on(RequestsTopics.JOIN_ROOM, (roomRequeststr) => {
    const userRepository = new UserRepository();
    const roomRepository = new RoomRepository();
    const joinRoomHandler = new JoinRoomHandler(socket, userRepository, roomRepository);
    const roomRequest = JSON.parse(roomRequeststr);
    const response = joinRoomHandler.handle({ room: roomRequest.room, username: roomRequest.username });

  });

  socket.on(RequestsTopics.LEAVE_ROOM, (leaveRequest) => {
    const userRepository = new UserRepository();
    const roomRepository = new RoomRepository();
    const leaveRoomHandler = new LeaveRoomHandler(socket, userRepository, roomRepository);

    leaveRoomHandler.handle({ username: leaveRequest.username });
  });

  socket.on(RequestsTopics.NEW_MESSAGE, (newMessage) => {
    const userRepository = new UserRepository();
    const roomRepository = new RoomRepository();
    const newMessageUseCase: SendMessageUseCase = new SendMessageUseCase(
      socket,
      userRepository,
      roomRepository
    );
    const newMessageRequest = JSON.parse(newMessage);
    newMessageUseCase.handle({
      content: newMessageRequest.content,
      username: newMessageRequest.username
    });
  });

  socket.on(GeneralGroups.GENERAL_NOTIFICATIONS, (message) => {
    const dateTime = new Date();
    socket.broadcast.emit(TopicsToSend.GENERAL_NOTIFICAITON, {
      message,
      date: dateTime
    });
  });


});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server is running on http://localhost:${PORT}`);
});

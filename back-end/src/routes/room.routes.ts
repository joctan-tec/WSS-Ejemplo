import express, { Request, Response } from "express";
import { RoomRepository } from "../database/room.repository";
import { UserRepository } from "../database/user.database";


const router = express.Router();

router.get('/', (request: Request, response: Response) => {
  const roomsRepository = new RoomRepository();
  response.json(roomsRepository.getRooms());
});

router.get('/user-exists/:name', (request: Request, response: Response) => {
  const { name } = request.params;
  const userRepository = new UserRepository();
  const user = userRepository.getUsers().find((user) => user.username === name);
  response.json({ exists: !!user });
});

export default router;
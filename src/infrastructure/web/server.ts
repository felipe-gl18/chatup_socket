import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import { SocketController } from "../../interface/controllers/SocketController";
import { registerRoute } from "../../interface/routes/registerRoute";
import { RegisterUserOnSocketUseCase } from "../../domain/use-cases/RegisterUserOnSocket";
import { InMemoryStoreUser } from "../persistence/inMemoryStoreUser";
import { ListUsersOnSocketUseCase } from "../../domain/use-cases/ListUsersOnSocket";
import { DeleteUserOnSocketUseCase } from "../../domain/use-cases/DeleteUserOnSocket";
import { InMemoryStoreMessages } from "../persistence/InMemoryStoreMessages";
import { SendMessageUseCase } from "../../domain/use-cases/SendMessage";
import { DeleteMessageUseCase } from "../../domain/use-cases/DeleteMessage";
import { GetAllUsersUseCase } from "../../domain/use-cases/GetAllUsers";

const allowedOrigins = [
  "http://localhost:5173",
  "https://chatup-lqz5.onrender.com",
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
};

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors(corsOptions));
app.use(express.json());
app.use("/register", registerRoute);

const server = createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// In Memory Stores
const inMemoryStoreUser = new InMemoryStoreUser();
const inMemoryStoreMessages = new InMemoryStoreMessages(inMemoryStoreUser);

// Use Cases User
const registerUserOnSocketUseCase = new RegisterUserOnSocketUseCase(
  inMemoryStoreUser
);
const listUsersOnSocketUseCase = new ListUsersOnSocketUseCase(
  inMemoryStoreUser
);
const deleteUserOnSocketUseCase = new DeleteUserOnSocketUseCase(
  inMemoryStoreUser
);
const getAllUserOnSocketUseCase = new GetAllUsersUseCase(inMemoryStoreUser);

// Use Cases Message
const sendMessageUseCase = new SendMessageUseCase(inMemoryStoreMessages);
const deleteMessageUseCase = new DeleteMessageUseCase(inMemoryStoreMessages);

// Controller
new SocketController(
  io,
  registerUserOnSocketUseCase,
  listUsersOnSocketUseCase,
  deleteUserOnSocketUseCase,
  getAllUserOnSocketUseCase,
  sendMessageUseCase,
  deleteMessageUseCase
).initialize();

server.listen(port, () => console.log(`The server is running at ${port}`));

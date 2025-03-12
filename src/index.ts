import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv/config";

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

const port = Number(process.env.PORT) || 3000;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

type User = {
  username: string;
  email: string;
  token: string;
  socketID: string;
};

const users: { [key: string]: User } = {};

app.post("/register", (request, response) => {
  const userData = request.body;
  const token = jwt.sign(userData, String(process.env.SECRET_KEY));
  response.json({ ...userData, token });
});

io.on("connection", (socket) => {
  socket.on("register", (user: User) => {
    users[user.token] = { ...user, socketID: socket.id };
    io.emit("newUser", users);
  });

  socket.on("getUsers", (token: string) => {
    const usersList = { ...users };
    delete usersList[token];
    socket.emit("users", usersList);
  });

  socket.on("deleteUser", ({ deletingUserToken, deletedUserToken }) => {
    const socketID = users[deletingUserToken].socketID;
    const usersList = { ...users };
    delete usersList[deletedUserToken];
    delete usersList[deletingUserToken];
    io.to(socketID).emit("users", usersList);
  });

  socket.on("sendMessage", ({ sender, receiver, message }) => {
    const socketID = users[receiver].socketID;
    io.to(socketID).emit("newMessage", { sender, message });
  });

  socket.on("deleteMessage", ({ sender, receiver, messageID }) => {
    const socketID = users[receiver].socketID;
    io.to(socketID).emit("deleteMessage", { sender, messageID });
  });

  socket.on("request_call", ({ requester, receiver, type }) => {
    const socketID = users[receiver].socketID;
    io.to(socketID).emit("receive_call", { requester, type });
  });

  socket.on("request_call_rejected", ({ requesterToken }) => {
    const socketID = users[requesterToken].socketID;
    io.to(socketID).emit("request_call_rejected");
  });

  socket.on("request_call_accepted", ({ requesterToken, type }) => {
    const socketID = users[requesterToken].socketID;
    io.to(socketID).emit("request_call_accepted", { type });
  });

  socket.on("finish_call", ({ requesterToken }) => {
    const socketID = users[requesterToken].socketID;
    io.to(socketID).emit("finish_call");
  });

  socket.on("offer", (data) => {
    const socketID = users[data.target].socketID;
    io.to(socketID).emit("offer", {
      sdp: data.sdp,
      from: data.from,
      type: data.type,
    });
  });

  socket.on("answer", (data) => {
    const socketID = users[data.target].socketID;
    io.to(socketID).emit("answer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    const socketID = users[data.target].socketID;
    io.to(socketID).emit("ice-candidate", data.candidate);
  });

  // deleting the disconnected user
  socket.on("disconnect", () => {
    const token = Object.keys(users).find(
      (key) => users[key].socketID == socket.id
    );
    if (!token) return;
    delete users[token];
    io.emit("disconnectedUser");
  });
});

server.listen(port, () => console.log(`The server is running at ${port}`));

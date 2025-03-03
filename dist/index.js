import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
const allowedOrigins = [
    "http://localhost:3000",
    "https://chatup-lqz5.onrender.com",
];
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST"],
};
const port = process.env.PORT || 3000;
const app = express();
app.use(cors(corsOptions));
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"],
    },
});
const users = {};
io.on("connection", (socket) => {
    socket.on("register", (user) => {
        users[user.phonenumber] = { ...user, socketID: socket.id };
        io.emit("newUser", users);
    });
    socket.on("getUsers", (phonenumber) => {
        const usersList = { ...users };
        delete usersList[phonenumber];
        socket.emit("users", usersList);
    });
    socket.on("deleteUser", ({ deletingUserPhonenumber, deletedUserPhonenumber }) => {
        const socketID = users[deletingUserPhonenumber].socketID;
        const usersList = { ...users };
        delete usersList[deletedUserPhonenumber];
        delete usersList[deletingUserPhonenumber];
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
    socket.on("request_call_rejected", ({ requesterPhonenumber }) => {
        const socketID = users[requesterPhonenumber].socketID;
        io.to(socketID).emit("request_call_rejected");
    });
    socket.on("request_call_accepted", ({ requesterPhonenumber }) => {
        const socketID = users[requesterPhonenumber].socketID;
        io.to(socketID).emit("request_call_accepted");
    });
    socket.on("finish_call", ({ requesterPhonenumber }) => {
        const socketID = users[requesterPhonenumber].socketID;
        io.to(socketID).emit("finish_call");
    });
    socket.on("offer", (data) => {
        const socketID = users[data.target].socketID;
        io.to(socketID).emit("offer", { sdp: data.sdp, from: socket.id });
    });
    socket.on("answer", (data) => {
        io.to(data.target).emit("answer", { sdp: data.sdp, from: socket.id });
    });
    socket.on("ice-candidate", (data) => {
        io.to(data.target).emit("ice-candidate", data.candidate);
    });
    // deleting the disconnected user
    socket.on("disconnect", () => {
        const phonenumber = Object.keys(users).find((key) => users[key].socketID == socket.id);
        if (!phonenumber)
            return;
        delete users[phonenumber];
        io.emit("disconnectedUser");
    });
});
server.listen(port, () => console.log(`The server is running at ${port}`));

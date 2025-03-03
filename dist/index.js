"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "http://localhost:5173", methods: ["GET", "POST"] }));
const server = (0, node_http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"],
    },
});
const users = {};
io.on("connection", (socket) => {
    socket.on("register", (user) => {
        users[user.phonenumber] = Object.assign(Object.assign({}, user), { socketID: socket.id });
        io.emit("newUser", users);
    });
    socket.on("getUsers", (phonenumber) => {
        const usersList = Object.assign({}, users);
        delete usersList[phonenumber];
        socket.emit("users", usersList);
    });
    socket.on("deleteUser", ({ deletingUserPhonenumber, deletedUserPhonenumber }) => {
        const socketID = users[deletingUserPhonenumber].socketID;
        const usersList = Object.assign({}, users);
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

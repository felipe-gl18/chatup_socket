import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import "dotenv/config";
import { randomUUID } from "node:crypto";
const allowedOrigins = [
    "http://localhost:5173",
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
const users = {};
const messages = {};
const deletedUsers = {};
app.post("/register", (request, response) => {
    const userData = request.body;
    const token = jwt.sign(userData, String(process.env.SECRET_KEY));
    response.json({
        ...userData,
        token,
    });
});
io.on("connection", (socket) => {
    socket.on("register", (user) => {
        users[user.token] = { ...user, socketID: socket.id };
        io.emit("newUser", users);
    });
    socket.on("getUsers", (token) => {
        const usersList = { ...users };
        delete usersList[token];
        socket.emit("users", usersList);
    });
    socket.on("deleteUser", ({ deletingUserToken, deletedUserToken }) => {
        const deletingSocketID = users[deletingUserToken].socketID;
        const deletedSocketID = users[deletedUserToken].socketID;
        deletedUsers[deletingUserToken] = deletedUsers[deletingUserToken] || [];
        deletedUsers[deletedUserToken] = deletedUsers[deletedUserToken] || [];
        if (!deletedUsers[deletingUserToken].includes(deletedUserToken)) {
            deletedUsers[deletingUserToken].push(deletedUserToken);
        }
        if (!deletedUsers[deletedUserToken].includes(deletingUserToken)) {
            deletedUsers[deletedUserToken].push(deletingUserToken);
        }
        const getFilteredUsers = (token) => {
            const blockedTokens = new Set(deletedUsers[token] || []);
            blockedTokens.add(token);
            return Object.fromEntries(Object.entries(users).filter(([userToken]) => !blockedTokens.has(userToken)));
        };
        io.to(deletingSocketID).emit("users", getFilteredUsers(deletingUserToken));
        io.to(deletedSocketID).emit("users", getFilteredUsers(deletedUserToken));
    });
    socket.on("sendMessage", ({ sender, receiver, message }) => {
        const senderSocketID = users[sender].socketID;
        const receiverSocketID = users[receiver].socketID;
        const messagesAccessToken = [sender, receiver].sort().join("|");
        const UUID = randomUUID();
        if (messages[messagesAccessToken]) {
            messages[messagesAccessToken].push({
                ...message,
                sender,
                receiver,
                UUID,
            });
        }
        else {
            messages[messagesAccessToken] = [
                {
                    ...message,
                    sender,
                    receiver,
                    UUID,
                },
            ];
        }
        io.to([receiverSocketID, senderSocketID]).emit("newMessage", {
            [messagesAccessToken]: messages[messagesAccessToken],
        });
    });
    socket.on("deleteMessage", ({ requester, receiver, UUID, accessToken }) => {
        const requesterSocketID = users[requester].socketID;
        const receiverSocketID = users[receiver].socketID;
        io.to([requesterSocketID, receiverSocketID]).emit("deleteMessage", {
            accessToken,
            UUID,
        });
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
        const token = Object.keys(users).find((key) => users[key].socketID == socket.id);
        if (!token)
            return;
        delete users[token];
        io.emit("disconnectedUser");
    });
});
server.listen(port, () => console.log(`The server is running at ${port}`));

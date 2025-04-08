import { Server, Socket } from "socket.io";
import { RegisterUserOnSocketUseCase } from "../../domain/use-cases/RegisterUserOnSocket";
import { ListUsersOnSocketUseCase } from "../../domain/use-cases/ListUsersOnSocket";
import { DeleteUserOnSocketUseCase } from "../../domain/use-cases/DeleteUserOnSocket";
import { SendMessageUseCase } from "../../domain/use-cases/SendMessage";
import { DeleteMessageUseCase } from "../../domain/use-cases/DeleteMessage";
import { GetAllUsersUseCase } from "../../domain/use-cases/GetAllUsers";

export class SocketController {
  private readonly io: Server;
  constructor(
    io: Server,
    private readonly registerUserOnSocketUseCase: RegisterUserOnSocketUseCase,
    private readonly listUsersOnSocket: ListUsersOnSocketUseCase,
    private readonly deleteUserOnSocketUseCase: DeleteUserOnSocketUseCase,
    private readonly getAllUserOnSocketUseCase: GetAllUsersUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase
  ) {
    this.io = io;
  }

  initialize() {
    this.io.on("connection", (socket) => {
      this.handleUserEvents(socket);
      this.handleMessageEvents(socket);
      this.handleCallEvents(socket);
    });
  }

  private handleUserEvents(socket: Socket) {
    socket.on("register", (user: any) => {
      this.registerUserOnSocketUseCase.execute(user, socket.id);
      this.io.emit("newUser");
    });

    socket.on("getUsers", (token: string) => {
      const users = this.listUsersOnSocket.execute(token);
      socket.emit("users", users);
    });

    socket.on("deleteUser", ({ deletingUserToken, deletedUserToken }) => {
      const { deletingUserData, deletedUserData } =
        this.deleteUserOnSocketUseCase.execute(
          deletingUserToken,
          deletedUserToken
        );
      this.io
        .to(deletingUserData.socketID)
        .emit("users", deletingUserData.users);
      this.io.to(deletedUserData.socketID).emit("users", deletedUserData.users);
    });
  }

  private handleMessageEvents(socket: Socket) {
    socket.on("sendMessage", ({ sender, receiver, message }) => {
      const { receiverSocketID, senderSocketID, messages } =
        this.sendMessageUseCase.execute(sender, receiver, message);
      this.io
        .to([receiverSocketID, senderSocketID])
        .emit("newMessage", messages);
    });

    socket.on("deleteMessage", ({ requester, receiver, UUID, accessToken }) => {
      const { receiverSocketID, requesterSocketID } =
        this.deleteMessageUseCase.execute(requester, receiver);
      this.io.to([requesterSocketID, receiverSocketID]).emit("deleteMessage", {
        accessToken,
        UUID,
      });
    });
  }

  private handleCallEvents(socket: Socket) {
    socket.on("request_call", ({ requester, receiver, type }) => {
      const users = this.getAllUserOnSocketUseCase.execute();
      const socketID = users[receiver].socketID;
      this.io.to(socketID).emit("receive_call", { requester, type });
    });

    socket.on("request_call_accepted", ({ requesterToken, type }) => {
      this.emitToUser(requesterToken, "request_call_accepted", { type });
    });

    socket.on("request_call_rejected", ({ requesterToken }) => {
      this.emitToUser(requesterToken, "request_call_rejected");
    });

    socket.on("finish_call", ({ requesterToken }) => {
      this.emitToUser(requesterToken, "finish_call");
    });

    socket.on("offer", (data) => {
      this.emitToUser(data.target, "offer", {
        sdp: data.sdp,
        from: data.from,
        type: data.type,
      });
    });

    socket.on("answer", (data) => {
      this.emitToUser(data.target, "answer", {
        sdp: data.sdp,
        from: socket.id,
      });
    });

    socket.on("ice-candidate", (data) => {
      this.emitToUser(data.target, "ice-candidate", data.candidate);
    });

    socket.on("disconnect", () => {
      const users = this.getAllUserOnSocketUseCase.execute();
      const token = Object.keys(users).find(
        (key) => users[key].socketID == socket.id
      );
      if (!token) return;
      delete users[token];
      this.io.emit("disconnectedUser");
    });
  }

  private emitToUser(token: string, event: string, data?: any) {
    const users = this.getAllUserOnSocketUseCase.execute();
    const socketID = users[token]?.socketID;
    if (socketID) this.io.to(socketID).emit(event, data);
  }
}

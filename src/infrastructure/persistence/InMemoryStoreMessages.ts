import { randomUUID } from "node:crypto";
import { InMemoryStore } from "../../domain/interfaces/InMemoryStore";
import { InMemoryStoreUser } from "./inMemoryStoreUser";

export class InMemoryStoreMessages implements InMemoryStore {
  private readonly messages: { [key: string]: any[] | null } = {};

  constructor(private readonly inMemoryStoreUser: InMemoryStoreUser) {}

  add(sender: string, receiver: string, message: any) {
    const users = this.inMemoryStoreUser.getAllUsers();
    const senderSocketID = users[sender].socketID;
    const receiverSocketID = users[receiver].socketID;

    const messagesAccessToken = [sender, receiver].sort().join("|");
    const UUID = randomUUID();

    if (this.messages[messagesAccessToken]) {
      this.messages[messagesAccessToken].push({
        ...message,
        sender,
        receiver,
        UUID,
      });
    } else {
      this.messages[messagesAccessToken] = [
        {
          ...message,
          sender,
          receiver,
          UUID,
        },
      ];
    }

    return {
      senderSocketID,
      receiverSocketID,
      messages: { [messagesAccessToken]: this.messages[messagesAccessToken] },
    };
  }

  delete(requester: string, receiver: string) {
    const users = this.inMemoryStoreUser.getAllUsers();
    const requesterSocketID = users[requester].socketID;
    const receiverSocketID = users[receiver].socketID;
    return {
      requesterSocketID,
      receiverSocketID,
    };
  }

  list(token: string) {}
}

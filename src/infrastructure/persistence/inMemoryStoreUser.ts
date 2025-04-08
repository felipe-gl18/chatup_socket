import { User } from "../../domain/entities/User";
import { InMemoryStore } from "../../domain/interfaces/InMemoryStore";
import { SocketUser } from "../../domain/use-cases/RegisterUserOnSocket";

type StoreUser = User & {
  token: string;
  socketID: string;
};

export class InMemoryStoreUser implements InMemoryStore {
  private readonly users: { [key: string]: StoreUser } = {};
  private readonly deletedUsers: { [key: string]: string[] | null } = {};

  add(user: SocketUser, socketID: string) {
    this.users[user.token] = { ...user, socketID };
  }

  delete(deletingUserToken: string, deletedUserToken: string) {
    const deletingSocketID = this.users[deletingUserToken].socketID;
    const deletedSocketID = this.users[deletedUserToken].socketID;

    this.deletedUsers[deletingUserToken] =
      this.deletedUsers[deletingUserToken] || [];
    this.deletedUsers[deletedUserToken] =
      this.deletedUsers[deletedUserToken] || [];

    if (!this.deletedUsers[deletingUserToken].includes(deletedUserToken)) {
      this.deletedUsers[deletingUserToken].push(deletedUserToken);
    }

    if (!this.deletedUsers[deletedUserToken].includes(deletingUserToken)) {
      this.deletedUsers[deletedUserToken].push(deletingUserToken);
    }

    const getFilteredUsers = (token: string) => {
      const blockedTokens = new Set(this.deletedUsers[token] || []);
      blockedTokens.add(token);

      return Object.fromEntries(
        Object.entries(this.users).filter(
          ([userToken]) => !blockedTokens.has(userToken)
        )
      );
    };

    return {
      deletingUserData: {
        socketID: deletingSocketID,
        users: getFilteredUsers(deletingUserToken),
      },
      deletedUserData: {
        socketID: deletedSocketID,
        users: getFilteredUsers(deletedUserToken),
      },
    };
  }

  list(token: string) {
    const usersList = { ...this.users };
    delete usersList[token];
    return usersList;
  }

  getAllUsers() {
    return this.users;
  }
}

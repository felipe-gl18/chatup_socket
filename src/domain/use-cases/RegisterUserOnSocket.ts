import { InMemoryStoreUser } from "../../infrastructure/persistence/inMemoryStoreUser";
import { User } from "../entities/User";

export type SocketUser = User & {
  token: string;
};

export class RegisterUserOnSocketUseCase {
  constructor(private readonly inMemoryStore: InMemoryStoreUser) {}
  execute(user: SocketUser, socketID: string) {
    this.inMemoryStore.add(user, socketID);
  }
}

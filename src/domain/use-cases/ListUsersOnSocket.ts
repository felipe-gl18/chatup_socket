import { InMemoryStoreUser } from "../../infrastructure/persistence/inMemoryStoreUser";

export class ListUsersOnSocketUseCase {
  constructor(private readonly inMemoryStore: InMemoryStoreUser) {}
  execute(token: string) {
    return this.inMemoryStore.list(token);
  }
}

import { InMemoryStoreUser } from "../../infrastructure/persistence/inMemoryStoreUser";

export class DeleteUserOnSocketUseCase {
  constructor(private readonly inMemoryStore: InMemoryStoreUser) {}
  execute(deletingUserToken: string, deletedUserToken: string) {
    return this.inMemoryStore.delete(deletingUserToken, deletedUserToken);
  }
}

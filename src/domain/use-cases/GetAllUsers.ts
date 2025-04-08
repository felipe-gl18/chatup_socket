import { InMemoryStoreUser } from "../../infrastructure/persistence/inMemoryStoreUser";

export class GetAllUsersUseCase {
  constructor(private inMemoryStoreUser: InMemoryStoreUser) {}
  execute() {
    return this.inMemoryStoreUser.getAllUsers();
  }
}

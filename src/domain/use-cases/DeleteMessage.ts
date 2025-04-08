import { InMemoryStoreMessages } from "../../infrastructure/persistence/InMemoryStoreMessages";

export class DeleteMessageUseCase {
  constructor(private readonly inMemoryStoreMessages: InMemoryStoreMessages) {}
  execute(requester: string, receiver: string) {
    return this.inMemoryStoreMessages.delete(requester, receiver);
  }
}

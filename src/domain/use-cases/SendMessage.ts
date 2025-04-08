import { InMemoryStoreMessages } from "../../infrastructure/persistence/InMemoryStoreMessages";

export class SendMessageUseCase {
  constructor(private readonly inMemoryStoreMessages: InMemoryStoreMessages) {}
  execute(sender: string, receiver: string, message: any) {
    return this.inMemoryStoreMessages.add(sender, receiver, message);
  }
}

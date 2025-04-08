export interface InMemoryStore {
  add(...args: any[]): void;
  delete(...args: any[]): any;
  list(...args: any[]): any;
}

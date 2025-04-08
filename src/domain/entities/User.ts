export class User {
  public readonly email: string;
  public readonly username: string;
  public readonly photo?: ArrayBuffer;

  constructor(props: { email: string; username: string; photo?: ArrayBuffer }) {
    this.email = props.email;
    this.username = props.username;
    this.photo = props.photo;
  }
}

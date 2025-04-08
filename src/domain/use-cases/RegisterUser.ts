import { User } from "../entities/User";
import jwt from "jsonwebtoken";

export class RegisterUserUseCase {
  execute(userData: User) {
    const token = jwt.sign(userData, String(process.env.SECRET_KEY));
    return { ...userData, token };
  }
}

import { Request, Response } from "express";
import { RegisterUserUseCase } from "../../domain/use-cases/RegisterUser";

export class RegisterController {
  private registerUserUseCase: RegisterUserUseCase;
  constructor() {
    this.registerUserUseCase = new RegisterUserUseCase();
  }

  handle(req: Request, res: Response) {
    const userData = req.body;
    try {
      const result = this.registerUserUseCase.execute(userData);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }
}

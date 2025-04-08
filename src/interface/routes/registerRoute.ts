import { Router } from "express";
import { RegisterController } from "../controllers/RegisterController";

const route = Router();

const registerController = new RegisterController();

route.post("", (req, res) => {
  registerController.handle(req, res);
});

export { route as registerRoute };

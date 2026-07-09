import { NextFunction, Request, Response } from 'express';
import { createUserSchema } from '../dto/user.dto';
import { UserService } from '../services/UserService';

const userService = new UserService();

export class UserController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(" req.body ", req.body)
      const dto = createUserSchema.parse(req.body);
      const user = await userService.createUser(dto.name);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

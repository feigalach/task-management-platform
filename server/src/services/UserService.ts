import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

export class UserService {
  async getAll(): Promise<User[]> {
    return AppDataSource.getRepository(User).find();
  }
  async createUser(name: string): Promise<User> {
    logger.info('Creating user', { name });

    const user = AppDataSource.getRepository(User).create({ name });
    const saved = await AppDataSource.getRepository(User).save(user);

    logger.info('User created', { userId: saved.id, name: saved.name });
    return saved;
  }
}

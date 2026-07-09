import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from './config/data-source';
import { User } from './entities/User';

const seed = async () => {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.find();
  if (existing.length > 0) {
    console.log('Users already seeded:');
    existing.forEach((u) => console.log(`- ${u.name}: ${u.id}`));
    await AppDataSource.destroy();
    return;
  }

  const names = ['Avi Cohen', 'Nu Shoin', 'Kol Hakavod', 'Good Luck'];
  const users = names.map((name) => userRepo.create({ name }));
  const saved = await userRepo.save(users);

  console.log('Seeded demo users:');
  saved.forEach((u) => console.log(`- ${u.name}: ${u.id}`));

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

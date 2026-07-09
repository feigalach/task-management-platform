import { Router } from 'express';
import taskRoutes from './task.routes';
import userRoutes from './user.routes';

const router = Router();
router.use(taskRoutes);
router.use(userRoutes);

export default router;

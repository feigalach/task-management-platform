import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';

const router = Router();
const taskController = new TaskController();

router.get('/task-types', taskController.getTaskTypes);
router.post('/tasks', taskController.create);
router.get('/tasks/:id', taskController.getOne);
router.get('/tasks/:id/history', taskController.getHistory);
router.post('/tasks/:id/status', taskController.changeStatus);
router.post('/tasks/:id/close', taskController.close);
router.get('/users/:userId/tasks', taskController.getUserTasks);

export default router;

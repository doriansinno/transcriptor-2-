import { Router } from 'express';
import { emergencyHelp } from '../controllers/emergencyController.js';

const router = Router();
router.post('/', emergencyHelp);
export default router;

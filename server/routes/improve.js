import { Router } from 'express';
import { improveNotes } from '../controllers/improveController.js';

const router = Router();
router.post('/', improveNotes);
export default router;

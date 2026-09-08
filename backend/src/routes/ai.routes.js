import { Router } from 'express';

import { chatController } from '../controllers/ai.controller.js';

import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/chat', chatController);

export default router;
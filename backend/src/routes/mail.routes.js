import { Router } from 'express';
import {
  getInbox,
  getSent,
  getEmail,
  send,
  reply,
  search
} from '../controllers/mail.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.get('/:id', getEmail);
router.post('/send', send);
router.post('/reply', reply);
router.post('/search', search);

export default router;
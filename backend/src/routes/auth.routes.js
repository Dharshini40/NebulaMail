import { Router } from 'express';
import {
  googleLogin,
  googleCallback,
  getMe,
  logout
} from '../controllers/auth.controller.js';

const router = Router();

router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
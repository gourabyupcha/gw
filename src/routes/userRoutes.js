import express from 'express';
import { proxyToUserService } from '../services/userService';

const router = express.Router();

router.get('/', proxyToUserService);  // GET /users

export default router;

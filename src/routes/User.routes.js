import express from 'express'
import {HandleUserHistory,HandleUserStats} from "../controller/User.controller.js"
import { userRateLimit } from '../middleware/RateLimit.middleware.js';

const router = express.Router();



router.get("/history",userRateLimit,HandleUserHistory);
router.get("/stats",userRateLimit,HandleUserStats);

export default router;
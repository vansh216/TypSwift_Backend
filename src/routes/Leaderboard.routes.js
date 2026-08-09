import express from 'express'
import HandleLeaderBoard from '../controller/Leaderboard.controller.js';
import { leaderboardRateLimit } from '../middleware/RateLimit.middleware.js';

const router = express.Router();

router.get("/",leaderboardRateLimit,HandleLeaderBoard);

export default router;
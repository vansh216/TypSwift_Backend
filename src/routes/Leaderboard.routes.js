import express from 'express'
import HandleLeaderBoard from '../controller/Leaderboard.controller.js';

const router = express.Router();

router.get("/",HandleLeaderBoard);

export default router;
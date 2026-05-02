import express from 'express'
import {HandleUserHistory,HandleUserStats} from "../controller/User.controller.js"

const router = express.Router();



router.get("/history",HandleUserHistory);
router.get("/stats",HandleUserStats);

export default router;
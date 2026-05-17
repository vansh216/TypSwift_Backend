import express from 'express'

const router = express.Router();

router.get("/",HandleLeaderBoard);

export default router;
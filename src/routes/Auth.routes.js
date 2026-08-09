import express from 'express'
import { HandleUserGetme,HandleUserLogin,HandleUserRegister } from '../controller/Auth.controller.js';
import { authRateLimit } from '../middleware/RateLimit.middleware.js';

const router = express.Router();
router.post("/register", authRateLimit,HandleUserRegister)
router.post("/login", authRateLimit,HandleUserLogin)
router.get("/me",authRateLimit,HandleUserGetme)


export default router;
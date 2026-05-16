import express from 'express'
import { HandleUserGetme,HandleUserLogin,HandleUserRegister } from '../controller/Auth.controller.js';

const router = express.Router();
router.post("/register",HandleUserRegister)
router.post("/login",HandleUserLogin)
router.get("/me",HandleUserGetme)


export default router;
import express from 'express'
import {
    HandleGetParagraph,
    HandleSubmitTest,
} from '../controller/Test.controller.js';
import OptionalProtect  from '../middleware/Auth.middleware.js'
import { testRateLimit } from '../middleware/RateLimit.middleware.js';

const router = express.Router();

router.get("/paragraph", testRateLimit, HandleGetParagraph);
router.post('/submit', testRateLimit, OptionalProtect, HandleSubmitTest)


export default  router; 





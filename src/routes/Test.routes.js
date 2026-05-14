import express from 'express'
import {
    HandleGetParagraph,
    HandleSubmitTest,
} from '../controller/Test.controller.js';
import OptionalProtect  from '../middleware/Auth.middleware.js'

const router = express.Router();

router.get("/paragraph", HandleGetParagraph);
router.post('/submit', OptionalProtect, HandleSubmitTest)


export default  router; 





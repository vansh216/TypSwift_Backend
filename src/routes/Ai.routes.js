import express        from 'express';
import { analyzeTest } from '../controller/Ai.controller.js';
import  OptionalProtect  from '../middleware/Auth.middleware.js';

const router = express.Router();

// POST /api/ai/analyze
// optional auth — guests can also get AI feedback
router.post('/analyze', OptionalProtect, analyzeTest);

export default router;
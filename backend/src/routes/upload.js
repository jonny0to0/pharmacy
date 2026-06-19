import express from 'express';
import { uploadFile } from '../controllers/uploadController.js';
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.post('/', authenticateToken, uploadMiddleware.single('file'), uploadFile);
export default router;
//# sourceMappingURL=upload.js.map
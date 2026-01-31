import express from 'express';
import multer from 'multer';
import { handleFormSubmission } from '../controllers/formSubmissionController.js';

const router = express.Router();

const upload = multer({ dest: 'temp_uploads/' });


router.post('/submit', upload.single('attachmentFile'), handleFormSubmission);

export default router;

// File: src/routes/leadRoutes.js

import express from 'express';
import { submitLeadAndGetToken, submitGeneralLead } from '../controllers/leadController.js';

const router = express.Router();

router.post('/submit', submitLeadAndGetToken);

router.post('/general', submitGeneralLead);

export default router;
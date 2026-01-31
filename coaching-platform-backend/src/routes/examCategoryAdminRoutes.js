import express from 'express';
const router = express.Router();

import { 
    createExamCategory,
    updateExamCategory,
    deleteExamCategory
} from '../controllers/examCategoryController.js';

import { protect} from '../middleware/authMiddleware.js';

router.use(protect);

router.route('/').post(createExamCategory);



router.route('/:id')
    .patch(updateExamCategory)
    .delete(deleteExamCategory);

export default router;

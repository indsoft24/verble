import express from 'express';
const router = express.Router();

import { 
    getAllExamCategories, 
    getCoursesForCategory 
} from '../controllers/examCategoryController.js';


router.route('/').get(getAllExamCategories);

router.route('/:slug/courses').get(getCoursesForCategory);

export default router;

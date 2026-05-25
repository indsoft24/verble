import express from 'express';
import { 
    getActiveSubscriptionPlans, 
    getSubscriptionPlansForCourse, 
    getSubscriptionPlanDetails,
    getFilterOptions
} from '../controllers/subscriptionController.js'; 

const router = express.Router();

router.get('/filter-options', getFilterOptions);

router.get('/:planId', getSubscriptionPlanDetails);

router.get('/', getActiveSubscriptionPlans);






// router.get('/courses/:courseId', getSubscriptionPlansForCourse);

export default router;

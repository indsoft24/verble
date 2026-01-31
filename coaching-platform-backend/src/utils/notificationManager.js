import Notification from '../models/Notification.js';
import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Course from '../models/Course.js';
import mongoose from 'mongoose';

const DEFAULT_CATEGORY = {
    key: 'general',
    label: 'General',
    examCategoryId: null,
};

const formatLabel = (value) => {
    if (!value) return 'General';
    return value
        .toString()
        .toLowerCase()
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildPlanCategoryMap = async (planIds) => {
    const planDocs = await SubscriptionPlan.find({ _id: { $in: planIds } })
        .select('_id topic course');

    const courseIds = [
        ...new Set(
            planDocs
                .map((plan) => plan.course)
                .filter((courseId) => Boolean(courseId))
        ),
    ];

    const courseDocs = await Course.find({ _id: { $in: courseIds } })
        .select('examCategory')
        .populate('examCategory', 'name slug');

    const courseCategoryMap = new Map();
    courseDocs.forEach((course) => {
        if (course.examCategory) {
            courseCategoryMap.set(course._id.toString(), {
                key: course.examCategory.slug || course.examCategory.name.toLowerCase(),
                label: course.examCategory.name,
                examCategoryId: course.examCategory._id,
            });
        }
    });

    const planCategoryMap = new Map();
    planDocs.forEach((plan) => {
        let categoryInfo = DEFAULT_CATEGORY;
        const topic = plan.topic ? plan.topic.trim() : null;
        if (topic) {
            categoryInfo = {
                key: topic.toLowerCase(),
                label: formatLabel(topic),
                examCategoryId: courseCategoryMap.get(plan.course?.toString())?.examCategoryId || null,
            };
        } else if (plan.course && courseCategoryMap.has(plan.course.toString())) {
            const courseCategory = courseCategoryMap.get(plan.course.toString());
            categoryInfo = {
                key: courseCategory.key,
                label: courseCategory.label,
                examCategoryId: courseCategory.examCategoryId,
            };
        }
        planCategoryMap.set(plan._id.toString(), categoryInfo);
    });

    return planCategoryMap;
};

export const createNotificationsForNewVideo = async (video) => {
    if (!video || !video.isPublished || video.requiredPlans.length === 0) {
        console.log(`[NotificationManager] Skipping notification for video ${video._id} (not published or no required plans).`);
        return;
    }

    try {
        const planIds = video.requiredPlans.map(plan => new mongoose.Types.ObjectId(plan));

        const planCategoryMap = await buildPlanCategoryMap(planIds);
        const planIdSet = new Set(planIds.map((id) => id.toString()));

        const usersToNotify = await User.find({
            'subscriptions.planId': { $in: planIds },
            'subscriptions.status': 'active',
            'subscriptions.endDate': { $gte: new Date() }
        }).select('_id subscriptions.planId');

        if (usersToNotify.length === 0) {
            console.log(`[NotificationManager] No subscribed users found to notify for video ${video._id}.`);
            return;
        }

        const userIds = usersToNotify.map(user => user._id);

        const notifications = userIds.map(userId => ({
            user: userId,
            title: `New Video Added: ${video.title}`,
            message: `A new video is now available in a course you're subscribed to.`,
            link: `/videos/${video._id}`,
            type: 'new_content',
        }));

        const notificationsWithCategories = notifications.map((notification, index) => {
            const user = usersToNotify[index];
            const matchingSubscription = user.subscriptions?.find((sub) =>
                sub.planId && planIdSet.has(sub.planId.toString())
            );
            const categoryInfo = matchingSubscription
                ? planCategoryMap.get(matchingSubscription.planId.toString()) || DEFAULT_CATEGORY
                : DEFAULT_CATEGORY;

            return {
                ...notification,
                categoryKey: categoryInfo.key,
                categoryLabel: categoryInfo.label,
                examCategory: categoryInfo.examCategoryId,
            };
        });

        await Notification.insertMany(notificationsWithCategories);
        console.log(`[NotificationManager] Successfully created ${notificationsWithCategories.length} notifications for video ${video._id}.`);

    } catch (error) {
        console.error(`[NotificationManager] Error creating notifications for video ${video._id}:`, error);
    }
};
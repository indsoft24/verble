import { getAllPublishedCoursesForUser, type CourseListItemUser } from './courseUserService';


export type Course = CourseListItemUser;


export const getFeaturedCoursesService = async (): Promise<Course[]> => {
    try {
        const allCourses = await getAllPublishedCoursesForUser();

        // Return the first 6 courses as the "featured" list.
        // You can change the number '6' to whatever you prefer.
        return allCourses.slice(0, 6);

    } catch (error: any) {
        throw error;
    }
};
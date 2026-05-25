/** Human-readable labels for MongoDB collection names (admin Database Manager). */

const COLLECTION_LABELS: Record<string, string> = {
    aiprompts: 'AI Prompts',
    blogposts: 'Blog Posts',
    certificateassessments: 'Certificate Assessments',
    certificateassessmentsubmissions: 'Certificate Assessment Submissions',
    certificates: 'Certificates',
    coursecertificaterules: 'Course Certificate Rules',
    coursecertificates: 'Course Certificates',
    courses: 'Courses',
    dailycontents: 'Daily Contents',
    databaseauditlogs: 'Database Audit Logs',
    examcategories: 'Exam Categories',
    knowledgebasearticles: 'Knowledge Base Articles',
    leads: 'Leads',
    modules: 'Modules',
    notifications: 'Notifications',
    offers: 'Offers',
    subscriptionplans: 'Subscription Plans',
    users: 'Users',
    usersentencesubmissions: 'Sentence Submissions',
    userstorysubmissions: 'Story Submissions',
    uservocabsubmissions: 'Vocabulary Submissions',
    userpuzzlesubmissions: 'Puzzle Submissions',
    userscenesubmissions: 'Scene Submissions',
    userspeechsubmissions: 'Speech Submissions',
    videos: 'Videos',
    videowatchprogresses: 'Video Watch Progress',
    promobanners: 'Promo Banners',
};

export function getCollectionDisplayName(collectionName: string): string {
    const key = collectionName.toLowerCase();
    if (COLLECTION_LABELS[key]) return COLLECTION_LABELS[key];

    return collectionName
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

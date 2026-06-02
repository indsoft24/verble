const normalizeEnvId = (value: string | undefined): string => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : '';
};

export const DEFAULT_VIDEO_COURSE_ID = normalizeEnvId(import.meta.env.VITE_DEFAULT_VIDEO_COURSE_ID);
export const DEFAULT_VIDEO_REQUIRED_PLAN_ID = normalizeEnvId(
    import.meta.env.VITE_DEFAULT_VIDEO_REQUIRED_PLAN_ID
);
export const DEFAULT_QUIZ_COURSE_ID = normalizeEnvId(import.meta.env.VITE_DEFAULT_QUIZ_COURSE_ID);

export const FALLBACK_VIDEO_COURSE_NAME = 'English Zero to Hero';
export const FALLBACK_VIDEO_REQUIRED_PLAN_NAME = 'Full Course';
export const FALLBACK_QUIZ_COURSE_NAME = 'English Zero to Hero';

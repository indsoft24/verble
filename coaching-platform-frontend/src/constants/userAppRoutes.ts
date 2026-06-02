/** Routes that use UserLayout (sidebar) — hide global Navbar/Footer */
export const USER_APP_ROUTE_PREFIXES = [
    '/dashboard',
    '/profile',
    '/my-courses',
    '/videos',
    '/my-rewards',
    '/my-subscription',
    '/notifications',
    '/professional-conversations',
    '/subscription-plans',
    '/modules',
] as const;

/** Authenticated course detail — hide marketing shell, not the /courses catalog */
const AUTHENTICATED_COURSE_DETAIL = /^\/courses\/[0-9a-fA-F]{24}$/;

export interface IsUserAppRouteOptions {
    isAuthenticated?: boolean;
}

export const isUserAppRoute = (pathname: string, options?: IsUserAppRouteOptions): boolean => {
    if (
        USER_APP_ROUTE_PREFIXES.some(
            (path) => pathname === path || pathname.startsWith(`${path}/`)
        )
    ) {
        return true;
    }
    if (options?.isAuthenticated && AUTHENTICATED_COURSE_DETAIL.test(pathname)) {
        return true;
    }
    return false;
};

/** Routes that use UserLayout (sidebar) — hide global Navbar/Footer */
export const USER_APP_ROUTE_PREFIXES = [
    '/dashboard',
    '/profile',
    '/my-courses',
    '/videos',
    '/my-subscription',
    '/notifications',
    '/professional-conversations',
    '/subscription-plans',
    '/modules',
] as const;

export const isUserAppRoute = (pathname: string): boolean =>
    USER_APP_ROUTE_PREFIXES.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

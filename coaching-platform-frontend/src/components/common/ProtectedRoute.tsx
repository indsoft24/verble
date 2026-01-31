// src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[]; // Optional: for role-based access control
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // You might want to show a global loading spinner instead of per-route
        return <div>Loading authentication status...</div>;
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Optional: Role-based access control
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User is authenticated but does not have the required role
        return <Navigate to="/unauthorized" replace />; // Or to a specific "Access Denied" page
    }

    return <Outlet />; // Render the child route (the actual protected component)
};

export default ProtectedRoute;
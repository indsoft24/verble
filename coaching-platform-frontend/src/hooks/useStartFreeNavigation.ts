import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Navigate to the user dashboard (guests are redirected to login by ProtectedRoute). */
export function useStartFreeNavigation() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return useCallback(() => {
        const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(dashboardPath);
    }, [user, navigate]);
}

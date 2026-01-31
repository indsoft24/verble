import { useCallback, useState } from 'react';
import * as authService from '../services/authService';

interface GoogleAuthState {
    isLoading: boolean;
    error: string | null;
}

interface GoogleAuthReturn extends GoogleAuthState {
    initiateGoogleLogin: () => Promise<void>;
    handleGoogleCallback: (code: string) => Promise<void>;
    linkGoogleAccount: (code: string) => Promise<void>;
    unlinkGoogleAccount: () => Promise<void>;
}

export const useGoogleAuth = (): GoogleAuthReturn => {
    const [state, setState] = useState<GoogleAuthState>({
        isLoading: false,
        error: null,
    });

    const initiateGoogleLogin = useCallback(async () => {
        setState({ isLoading: true, error: null });
        try {
            const { authUrl } = await authService.getGoogleAuthUrl();
            // Redirect to Google OAuth
            window.location.href = authUrl;
        } catch (error: any) {
            setState({ isLoading: false, error: error.message || 'Failed to initiate Google login' });
        }
    }, []);

    const handleGoogleCallback = useCallback(async (code: string) => {
        setState({ isLoading: true, error: null });
        try {
            // The callback will be handled by the backend redirect
            // This function is for manual handling if needed
            window.location.href = `${window.location.origin}/auth/google/callback?code=${code}`;
        } catch (error: any) {
            setState({ isLoading: false, error: error.message || 'Failed to handle Google callback' });
        }
    }, []);

    const linkGoogleAccount = useCallback(async (code: string) => {
        setState({ isLoading: true, error: null });
        try {
            await authService.linkGoogleAccount(code);
            setState({ isLoading: false, error: null });
        } catch (error: any) {
            setState({ isLoading: false, error: error.message || 'Failed to link Google account' });
        }
    }, []);

    const unlinkGoogleAccount = useCallback(async () => {
        setState({ isLoading: true, error: null });
        try {
            await authService.unlinkGoogleAccount();
            setState({ isLoading: false, error: null });
        } catch (error: any) {
            setState({ isLoading: false, error: error.message || 'Failed to unlink Google account' });
        }
    }, []);

    return {
        ...state,
        initiateGoogleLogin,
        handleGoogleCallback,
        linkGoogleAccount,
        unlinkGoogleAccount,
    };
};

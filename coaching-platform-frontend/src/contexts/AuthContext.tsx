// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authService from '../services/authService';
import apiClient from '../services/apiClient';

export type User = authService.User;

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: authService.LoginCredentials) => Promise<void>;
    register: (userData: authService.RegisterData) => Promise<{ email: string }>;
    verifyAndLogin: (payload: authService.VerificationPayload) => Promise<void>;
    resendOtp: (email: string) => Promise<string>;
    logout: () => Promise<void>;
    setUserContext: (userData: User | null, token?: string | null) => void;
    refreshUser: (currentToken?: string | null) => Promise<void>;
    initiateGoogleLogin: () => Promise<void>;
    linkGoogleAccount: (code: string) => Promise<void>;
    unlinkGoogleAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const handleSetAuthData = (userData: User | null, tokenData?: string | null) => {
        const finalUserData = userData ? { ...userData, subscriptions: Array.isArray(userData.subscriptions) ? userData.subscriptions : [] } : null;
        setUserState(finalUserData);
        setTokenState(tokenData ?? null);

        if (tokenData) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;
            localStorage.setItem('authToken', tokenData);
            if(finalUserData) localStorage.setItem('authUser', JSON.stringify(finalUserData));
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        }
    };

    const refreshUser = useCallback(async (currentToken?: string | null) => {
        const tokenToUse = currentToken !== undefined ? currentToken : token;
        if (!tokenToUse) {
            handleSetAuthData(null, null);
            setIsLoading(false);
            return;
        }
        try {
            const refreshedUserData = await authService.getCurrentUser();
            if (refreshedUserData) {
                handleSetAuthData(refreshedUserData, tokenToUse);
            } else {
                handleSetAuthData(null, null);
            }
        } catch (error) {
            handleSetAuthData(null, null);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                setTokenState(storedToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                await refreshUser(storedToken);
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, [refreshUser]);


    const login = async (credentials: authService.LoginCredentials) => {
        setIsLoading(true);
        try {
            const response = await authService.login(credentials);
            if (response.token && response.data?.user) {
                handleSetAuthData(response.data.user, response.token);
            } else { throw new Error(response.message || 'Login failed'); }
        } catch (error) {
            handleSetAuthData(null, null);
            throw error;
        }
        finally { setIsLoading(false); }
    };

    const register = async (userData: authService.RegisterData) => {
        setIsLoading(true);
        try {
            const response = await authService.register(userData);
            if (response.status === 'success' && response.data.email) {
                return response.data;
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const verifyAndLogin = async (payload: authService.VerificationPayload) => {
        setIsLoading(true);
        try {
            const response = await authService.verifyEmail(payload);
            if (response.token && response.data?.user) {
                handleSetAuthData(response.data.user, response.token);
            } else {
                throw new Error(response.message || 'Verification failed');
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const resendOtp = async (email: string) => {
        try {
            const response = await authService.resendVerificationEmail(email);
            return response.message || 'A new OTP has been sent.';
        } catch (error: any) {
            throw new Error(error.message || 'Failed to resend OTP.');
        }
    };

    const logout = async () => {
        try {
            await authService.logoutUserServer();
        } catch (error) {
            // Server logout failed, continue with local logout
        }
        handleSetAuthData(null, null);
    };

    const initiateGoogleLogin = async () => {
        try {
            const { authUrl } = await authService.getGoogleAuthUrl();
            // Redirect to Google OAuth
            window.location.href = authUrl;
        } catch (error: any) {
            throw error;
        }
    };

    const linkGoogleAccount = async (code: string) => {
        try {
            await authService.linkGoogleAccount(code);
            // Refresh user data to get updated Google profile
            await refreshUser();
        } catch (error: any) {
            throw error;
        }
    };

    const unlinkGoogleAccount = async () => {
        try {
            await authService.unlinkGoogleAccount();
            // Refresh user data to reflect the unlinked state
            await refreshUser();
        } catch (error: any) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user, token, isAuthenticated: !!token && !!user, isLoading,
                login,
                register,
                verifyAndLogin,
                resendOtp,
                logout,
                setUserContext: handleSetAuthData,
                refreshUser,
                initiateGoogleLogin,
                linkGoogleAccount,
                unlinkGoogleAccount
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
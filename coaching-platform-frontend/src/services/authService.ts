// src/services/authService.ts
import apiClient from './apiClient';


export interface UserSubscriptionInstance {
    _id?: string;
    planId: string | { _id: string; name: string; [key: string]: any };
    planName: string;
    status: 'none' | 'active' | 'pending_cancellation' | 'cancelled' | 'expired' | 'trial' | 'future_active';
    startDate: string | Date;
    endDate: string | Date;
    stripeSubscriptionId?: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
    mobile?: string;
    subscriptions: UserSubscriptionInstance[];
    stripeCustomerId?: string;
    isEmailVerified: boolean;
    createdAt?: string;
    updatedAt?: string;
    googleId?: string;
    authProvider?: 'local' | 'google' | 'phone_pin';
    loginPinConfigured?: boolean;
    googleProfile?: {
        id: string;
        email: string;
        name: string;
        picture: string;
        verified_email: boolean;
        locale: string;
    };
    points?: number;
    evaluationScore?: number;
    coins?: number;
    membershipLevel?: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE';
    unlockedLevels?: string[];
    streaks?: {
        free?: { current: number; max: number; lastActive: string | null };
        bronze?: { current: number; max: number; lastActive: string | null };
        silver?: { current: number; max: number; lastActive: string | null };
    };
}

/** Gamification fields returned after activity submission (dashboard streak / path). */
export interface UserProgressSnapshot {
    streaks?: User['streaks'];
    membershipLevel?: User['membershipLevel'];
    unlockedLevels?: string[];
    points?: number;
}

interface AuthResponseData {
    user: User;
}

// Standard response when user is authenticated (login, verify)
export interface AuthResponse {
    status: string;
    message?: string;
    token: string;
    data: AuthResponseData;
}

// Response from the initial registration step
export interface RegistrationInitResponse {
    status: string;
    message: string;
    data: {
        email: string;
    };
}

// Payload for the verification step
export interface VerificationPayload {
    email: string;
    otp: string;
}

export interface LoginCredentials { email?: string; password?: string; mobile?: string; }
export interface PhonePinLoginPayload {
    phoneNumber: string;
    pin: string;
}
export interface RegisterData {
    name?: string;
    email?: string;
    password?: string;
    phoneNumber?: string;
    mobile?: string;
    role?: string;
    agreedToTerms?: boolean;
}
export interface MobileOTPRequest { mobile: string; }
export interface MobileOTPVerify { mobile: string; otp: string; name?: string; }

// --- API FUNCTIONS ---

const API_URL_AUTH = `/auth`;

/**
 * Initiates user registration. Sends user data and triggers OTP email.
 */
export const register = async (userData: RegisterData): Promise<RegistrationInitResponse> => {
    try {
        const response = await apiClient.post<RegistrationInitResponse>(`${API_URL_AUTH}/register`, userData);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'An unknown registration error occurred' };
    }
};

/**
 * Verifies the user's email with an OTP and logs them in.
 */
export interface VerifyEmailResponse {
    status: string;
    message: string;
    data?: { email: string; loginPin?: string };
}

export interface VerifyEmailResult {
    message: string;
    email?: string;
    loginPin?: string;
}

export const verifyEmail = async (payload: VerificationPayload): Promise<VerifyEmailResult> => {
    try {
        const response = await apiClient.post<VerifyEmailResponse>(`${API_URL_AUTH}/verify-email`, payload);
        return {
            message: response.data.message,
            email: response.data.data?.email,
            loginPin: response.data.data?.loginPin,
        };
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'An unknown verification error occurred' };
    }
};

/**
 * Requests a new OTP to be sent to the user's email.
 */
export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post<{ message: string }>(`${API_URL_AUTH}/resend-verification-email`, { email });
        return response.data;
    } catch (error: any) {
        // Preserve cooldown information from backend
        const errorData = error.response?.data || { status: 'error', message: 'Failed to resend OTP' };
        throw errorData;
    }
};

export const loginWithPhonePin = async (payload: PhonePinLoginPayload): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post<AuthResponse>(`${API_URL_AUTH}/phone-pin/login`, payload);
        if (response.data?.data?.user && !Array.isArray(response.data.data.user.subscriptions)) {
            response.data.data.user.subscriptions = [];
        }
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || { status: 'error', message: 'Login failed' };
        throw errorData;
    }
};

export const forgotLoginPin = async (phoneNumber: string): Promise<string> => {
    try {
        const response = await apiClient.post<{ status: string; message: string }>(
            `${API_URL_AUTH}/phone-pin/forgot-pin`,
            { phoneNumber }
        );
        return response.data.message || 'If an account exists, a new PIN has been sent to your email.';
    } catch (error: any) {
        throw error.response?.data || { message: 'Could not send PIN email.' };
    }
};

export const regenerateLoginPinAfterVerification = async (payload: {
    currentPin: string;
}): Promise<{ message: string; newPin: string }> => {
    try {
        const response = await apiClient.post<{
            status: string;
            message: string;
            data?: { newPin?: string };
        }>(`${API_URL_AUTH}/phone-pin/regenerate-after-verify`, payload);
        return {
            message: response.data.message || 'New PIN generated.',
            newPin: response.data.data?.newPin || '',
        };
    } catch (error: any) {
        const err = error.response?.data || error;
        throw new Error(err.message || 'Failed to regenerate PIN.');
    }
};

export const changeLoginPin = async (payload: {
    currentPin?: string;
    newPin: string;
}): Promise<string> => {
    try {
        const response = await apiClient.patch<{ status: string; message: string }>(
            `${API_URL_AUTH}/phone-pin/change-pin`,
            payload
        );
        return response.data.message || 'PIN updated successfully.';
    } catch (error: any) {
        const err = error.response?.data || error;
        throw new Error(err.message || 'Failed to update PIN.');
    }
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post<AuthResponse>(`${API_URL_AUTH}/login`, credentials);
        if (response.data?.data?.user && !Array.isArray(response.data.data.user.subscriptions)) {
            response.data.data.user.subscriptions = [];
        }
        return response.data;
    } catch (error: any) {
        // Preserve the error structure including code and data for EMAIL_NOT_VERIFIED
        const errorData = error.response?.data || { status: 'error', message: 'An unknown login error occurred' };
        throw errorData;
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const response = await apiClient.get<{ status: string; data: { user: User } }>(`${API_URL_AUTH}/me`);
        if (response.data?.status === 'success' && response.data?.data?.user) {
            const user = response.data.data.user;
            if (!Array.isArray(user.subscriptions)) {
                user.subscriptions = [];
            }
            return user;
        }
        return null;
    } catch (error) {
        return null;
    }
};

export const logoutUserServer = async (): Promise<{ status: string; message: string }> => {
    try {
        const response = await apiClient.post<{ status: string; message: string }>(`${API_URL_AUTH}/logout`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Logout request to server failed' };
    }
};

export const forgotPassword = async (email: string): Promise<string> => {
    try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data.message || 'If an account exists, a reset link has been sent.';
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'An error occurred. Please try again.');
    }
};

export const resetPassword = async (token: string, password: string): Promise<string> => {
    try {
        const response = await apiClient.patch(`/auth/reset-password/${token}`, { password });
        return response.data.message || 'Password reset successfully.';
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to reset password.');
    }
};

// Google OAuth functions
export const getGoogleAuthUrl = async (): Promise<{ authUrl: string }> => {
    try {
        const response = await apiClient.get<{ status: string; data: { authUrl: string } }>(`${API_URL_AUTH}/google`);
        return response.data.data;
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to get Google auth URL' };
    }
};

export const linkGoogleAccount = async (code: string): Promise<{ status: string; message: string }> => {
    try {
        const response = await apiClient.post<{ status: string; message: string }>(`${API_URL_AUTH}/link-google`, { code });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to link Google account' };
    }
};

export const unlinkGoogleAccount = async (): Promise<{ status: string; message: string }> => {
    try {
        const response = await apiClient.delete<{ status: string; message: string }>(`${API_URL_AUTH}/unlink-google`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to unlink Google account' };
    }
};

// Mobile OTP Authentication functions
export const sendMobileOTP = async (mobile: string): Promise<{ status: string; message: string; data: { mobile: string; expiresIn: number } }> => {
    try {
        const response = await apiClient.post<{ status: string; message: string; data: { mobile: string; expiresIn: number } }>(
            `${API_URL_AUTH}/mobile/send-otp`,
            { mobile }
        );
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || { status: 'error', message: 'Failed to send OTP' };
        throw errorData;
    }
};

export const verifyMobileOTP = async (payload: MobileOTPVerify): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post<AuthResponse>(`${API_URL_AUTH}/mobile/verify-otp`, payload);
        if (response.data?.data?.user && !Array.isArray(response.data.data.user.subscriptions)) {
            response.data.data.user.subscriptions = [];
        }
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'An unknown verification error occurred' };
    }
};

export const loginWithMobile = async (mobile: string): Promise<{ status: string; message: string; data: { mobile: string; expiresIn: number } }> => {
    try {
        const response = await apiClient.post<{ status: string; message: string; data: { mobile: string; expiresIn: number } }>(
            `${API_URL_AUTH}/mobile/login`,
            { mobile }
        );
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || { status: 'error', message: 'Failed to send OTP' };
        throw errorData;
    }
};

export const registerWithMobile = async (mobile: string, name: string): Promise<{ status: string; message: string; data: { mobile: string; expiresIn: number } }> => {
    try {
        const response = await apiClient.post<{ status: string; message: string; data: { mobile: string; expiresIn: number } }>(
            `${API_URL_AUTH}/mobile/register`,
            { mobile, name }
        );
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || { status: 'error', message: 'Failed to send OTP' };
        throw errorData;
    }
};
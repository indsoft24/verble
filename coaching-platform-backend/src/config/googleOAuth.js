// src/config/googleOAuth.js
import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

// Google OAuth2 configuration for multiple platforms
export const googleOAuthConfig = {
    // Web Application Credentials
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    webClientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    
    // Android Application Credentials
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    
    // iOS Application Credentials
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    
    // Redirect URIs
    webRedirectUri: process.env.GOOGLE_WEB_REDIRECT_URI || `${process.env.BASE_URL}/api/auth/google/callback`,
    androidRedirectUri: process.env.GOOGLE_ANDROID_REDIRECT_URI || 'com.yourcompany.coachingplatform:/oauth2redirect',
    
    // Scopes
    scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]
};

// Create OAuth2 client for web
export const webOAuth2Client = new google.auth.OAuth2(
    googleOAuthConfig.webClientId,
    googleOAuthConfig.webClientSecret,
    googleOAuthConfig.webRedirectUri
);

// Create OAuth2 client for Android (no secret needed)
export const androidOAuth2Client = new google.auth.OAuth2(
    googleOAuthConfig.androidClientId,
    null, // Android doesn't use client secret
    googleOAuthConfig.androidRedirectUri
);

// Generate Google OAuth URL for web
export const getGoogleAuthUrl = (platform = 'web', state = null) => {
    const client = platform === 'android' ? androidOAuth2Client : webOAuth2Client;
    const redirectUri = platform === 'android' ? googleOAuthConfig.androidRedirectUri : googleOAuthConfig.webRedirectUri;
    
    const authUrlOptions = {
        access_type: 'offline',
        scope: googleOAuthConfig.scope,
        prompt: 'consent',
        redirect_uri: redirectUri
    };
    
    // Include state if provided (for storing frontend URL)
    if (state) {
        authUrlOptions.state = state;
    }
    
    return client.generateAuthUrl(authUrlOptions);
};

// Exchange authorization code for tokens (works for both platforms)
export const getGoogleTokens = async (code, platform = 'web') => {
    try {
        const client = platform === 'android' ? androidOAuth2Client : webOAuth2Client;
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);
        return tokens;
    } catch (error) {
        // Error getting Google tokens (details not logged for security)
        throw new Error('Failed to exchange authorization code for tokens');
    }
};

// Get user info from Google (works for both platforms)
export const getGoogleUserInfo = async (tokens, platform = 'web') => {
    try {
        const client = platform === 'android' ? androidOAuth2Client : webOAuth2Client;
        client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data } = await oauth2.userinfo.get();
        return data;
    } catch (error) {
        // Error getting Google user info (details not logged for security)
        throw new Error('Failed to get user information from Google');
    }
};

// Verify Android/iOS ID token (for mobile platforms)
export const verifyAndroidIdToken = async (idToken) => {
    const errors = [];
    
    // Try with Android client ID first
    if (googleOAuthConfig.androidClientId) {
        try {
            const client = new google.auth.OAuth2(
                googleOAuthConfig.androidClientId,
                null,
                googleOAuthConfig.androidRedirectUri
            );

            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: googleOAuthConfig.androidClientId
            });

            const payload = ticket.getPayload();
            return payload;
        } catch (androidError) {
            errors.push(`Android: ${androidError.message}`);
        }
    }
    
    // Try with iOS client ID
    if (googleOAuthConfig.iosClientId) {
        try {
            const client = new google.auth.OAuth2(
                googleOAuthConfig.iosClientId,
                null,
                null
            );

            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: googleOAuthConfig.iosClientId
            });

            const payload = ticket.getPayload();
            return payload;
        } catch (iosError) {
            errors.push(`iOS: ${iosError.message}`);
        }
    }
    
    // If mobile client IDs fail, try with web client ID (for compatibility)
    if (googleOAuthConfig.webClientId) {
        try {
            const client = new google.auth.OAuth2(
                googleOAuthConfig.webClientId,
                null,
                googleOAuthConfig.webRedirectUri
            );

            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: googleOAuthConfig.webClientId
            });

            const payload = ticket.getPayload();
            return payload;
        } catch (webError) {
            errors.push(`Web: ${webError.message}`);
        }
    }
    
    // If all failed, throw an error
    throw new Error('Failed to verify ID token with all available client IDs.');
};

export default {
    googleOAuthConfig,
    webOAuth2Client,
    androidOAuth2Client,
    getGoogleAuthUrl,
    getGoogleTokens,
    getGoogleUserInfo,
    verifyAndroidIdToken
};

// test-oauth-integration.js
// Test script to verify Google OAuth integration
import mongoose from 'mongoose';
import User from './src/models/User.js';
import { getGoogleAuthUrl, getGoogleTokens, getGoogleUserInfo } from './src/config/googleOAuth.js';
import dotenv from 'dotenv';

dotenv.config();

// Mock Google user data for testing
const mockGoogleUser = {
    id: '123456789',
    email: 'test@gmail.com',
    verified_email: true,
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    locale: 'en'
};

// Mock tokens for testing
const mockTokens = {
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600000
};

async function testOAuthIntegration() {
    try {
        console.log('🧪 Starting OAuth Integration Tests...\n');

        // Test 1: Environment Variables
        console.log('1️⃣ Testing Environment Variables...');
        const requiredEnvVars = [
            'GOOGLE_WEB_CLIENT_ID', 
            'GOOGLE_WEB_CLIENT_SECRET', 
            'GOOGLE_WEB_REDIRECT_URI',
            'GOOGLE_ANDROID_CLIENT_ID'
        ];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.log('❌ Missing environment variables:', missingVars);
            console.log('Please add these to your .env file:\n');
            missingVars.forEach(varName => {
                console.log(`${varName}=your_${varName.toLowerCase()}_here`);
            });
            console.log('\n📋 See COMPLETE_OAUTH_SETUP_GUIDE.md for detailed setup instructions');
            return;
        }
        console.log('✅ All required environment variables are set\n');

        // Test 2: Database Connection
        console.log('2️⃣ Testing Database Connection...');
        if (!process.env.MONGODB_URI) {
            console.log('❌ MONGODB_URI not set in environment variables');
            return;
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database connected successfully\n');

        // Test 3: Google OAuth URL Generation
        console.log('3️⃣ Testing Google OAuth URL Generation...');
        try {
            // Test web OAuth URL
            const webAuthUrl = getGoogleAuthUrl('web');
            if (webAuthUrl && webAuthUrl.includes('accounts.google.com')) {
                console.log('✅ Web Google OAuth URL generated successfully');
                console.log('🔗 Web Auth URL:', webAuthUrl.substring(0, 100) + '...');
            } else {
                console.log('❌ Invalid Web Google OAuth URL generated');
            }

            // Test Android OAuth URL
            const androidAuthUrl = getGoogleAuthUrl('android');
            if (androidAuthUrl && androidAuthUrl.includes('accounts.google.com')) {
                console.log('✅ Android Google OAuth URL generated successfully');
                console.log('🔗 Android Auth URL:', androidAuthUrl.substring(0, 100) + '...\n');
            } else {
                console.log('❌ Invalid Android Google OAuth URL generated\n');
            }
        } catch (error) {
            console.log('❌ Error generating Google OAuth URL:', error.message);
        }

        // Test 4: User Model OAuth Fields
        console.log('4️⃣ Testing User Model OAuth Fields...');
        try {
            const testUser = new User({
                name: 'OAuth Test User',
                email: 'oauth-test@example.com',
                googleId: 'test-google-id',
                authProvider: 'google',
                googleProfile: mockGoogleUser,
                isEmailVerified: true
            });

            // Validate the user (without saving)
            const validationError = testUser.validateSync();
            if (validationError) {
                console.log('❌ User model validation failed:', validationError.message);
            } else {
                console.log('✅ User model OAuth fields are valid');
            }
        } catch (error) {
            console.log('❌ Error testing User model:', error.message);
        }

        // Test 5: Existing User with OAuth
        console.log('5️⃣ Testing OAuth User Creation...');
        try {
            // Clean up any existing test user
            await User.deleteOne({ email: 'oauth-test@example.com' });

            const oauthUser = new User({
                name: 'OAuth Test User',
                email: 'oauth-test@example.com',
                googleId: 'test-google-id-123',
                authProvider: 'google',
                googleProfile: mockGoogleUser,
                isEmailVerified: true,
                subscriptions: []
            });

            await oauthUser.save();
            console.log('✅ OAuth user created successfully');

            // Test finding OAuth user
            const foundUser = await User.findOne({ googleId: 'test-google-id-123' });
            if (foundUser) {
                console.log('✅ OAuth user found by googleId');
            } else {
                console.log('❌ Failed to find OAuth user by googleId');
            }

            // Clean up test user
            await User.deleteOne({ _id: oauthUser._id });
            console.log('✅ Test user cleaned up\n');

        } catch (error) {
            console.log('❌ Error testing OAuth user creation:', error.message);
        }

        // Test 6: Mixed Authentication (Local + OAuth)
        console.log('6️⃣ Testing Mixed Authentication...');
        try {
            // Create a local user first
            const localUser = new User({
                name: 'Local Test User',
                email: 'local-test@example.com',
                password: 'testpassword123',
                authProvider: 'local',
                isEmailVerified: true,
                subscriptions: []
            });

            await localUser.save();
            console.log('✅ Local user created');

            // Simulate linking Google account
            localUser.googleId = 'linked-google-id-456';
            localUser.googleProfile = mockGoogleUser;
            await localUser.save();

            console.log('✅ Google account linked to local user');

            // Verify the user can be found by both email and googleId
            const foundByEmail = await User.findOne({ email: 'local-test@example.com' });
            const foundByGoogleId = await User.findOne({ googleId: 'linked-google-id-456' });

            if (foundByEmail && foundByGoogleId && foundByEmail._id.toString() === foundByGoogleId._id.toString()) {
                console.log('✅ Mixed authentication user found correctly');
            } else {
                console.log('❌ Mixed authentication user not found correctly');
            }

            // Clean up
            await User.deleteOne({ _id: localUser._id });
            console.log('✅ Mixed auth test user cleaned up\n');

        } catch (error) {
            console.log('❌ Error testing mixed authentication:', error.message);
        }

        console.log('🎉 OAuth Integration Tests Completed!');
        console.log('\n📋 Next Steps:');
        console.log('1. Set up Google Cloud Console credentials');
        console.log('2. Add environment variables to your .env file');
        console.log('3. Test the actual OAuth flow with a real Google account');
        console.log('4. Update your frontend to integrate with the OAuth endpoints');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Database disconnected');
    }
}

// Run the tests
testOAuthIntegration();

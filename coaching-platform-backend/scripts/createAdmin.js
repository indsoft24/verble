// scripts/createAdmin.js
// Script to create an admin user in the database
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.DOCKER_ENV 
            ? (process.env.MONGODB_URI_DOCKER || process.env.MONGODB_URI)
            : (process.env.MONGODB_URI || process.env.MONGODB_URI_DOCKER);
        
        if (!mongoURI) {
            throw new Error('MongoDB URI not found. Please set MONGODB_URI in your .env file.');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Get admin credentials from command line arguments or use defaults
        const email = process.argv[2] || 'admin@verble.app';
        const password = process.argv[3] || 'Admin@123';
        const name = process.argv[4] || 'Admin User';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingAdmin) {
            if (existingAdmin.role === 'admin') {
                console.log(`⚠️  Admin user with email "${email}" already exists.`);
                console.log('   To update password, use: node scripts/createAdmin.js <email> <newPassword> <name>');
                process.exit(0);
            } else {
                // Update existing user to admin
                existingAdmin.role = 'admin';
                existingAdmin.isEmailVerified = true; // Skip email verification for admin
                if (password) {
                    existingAdmin.password = password; // Will be hashed by pre-save hook
                }
                if (name) {
                    existingAdmin.name = name;
                }
                await existingAdmin.save();
                console.log(`✅ Updated existing user "${email}" to admin role.`);
                console.log(`   Email: ${email}`);
                console.log(`   Password: ${password}`);
                process.exit(0);
            }
        }

        // Create new admin user
        const adminUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: 'admin',
            authProvider: 'local',
            isEmailVerified: true, // Skip email verification for admin setup
        });

        await adminUser.save();
        console.log('\n✅ Admin user created successfully!');
        console.log('\n📋 Admin Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Name: ${name}`);
        console.log('\n⚠️  Please change the password after first login for security.');
        console.log('\n🔗 Login URL: http://localhost:5173/login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        if (error.code === 11000) {
            console.error('   A user with this email already exists.');
        }
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
};

createAdmin();

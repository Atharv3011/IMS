import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import user from './models/user.js';
import connectDB from './db/connection.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env file
const envPath = resolve('.env');
try {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                const value = line.substring(equalIndex + 1).trim();
                if (key && value) {
                    process.env[key] = value;
                }
            }
        }
    });
    console.log('Environment variables loaded successfully');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
} catch (error) {
    console.error('Error loading .env file:', error.message);
}

const register = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected successfully!');
        
        // Check if admin already exists
        const existingAdmin = await user.findOne({ email: 'admin@gmail.com' });
        if (existingAdmin) {
            console.log("Admin user already exists");
            await mongoose.connection.close();
            process.exit(0);
        }

        console.log('Creating admin user...');
        const hashPassword = await bcrypt.hash('admin', 10);
        const newUser = new user({
            name: "admin",
            email: 'admin@gmail.com',
            password: hashPassword,
            address: "admin address",
            role: "admin"
        })

        await newUser.save();
        console.log("Admin user seeded successfully");
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}    

register();
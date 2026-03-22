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

        // Add test customers
        console.log('Creating test customers...');
        const customerEmails = ['john@example.com', 'sarah@example.com', 'mike@example.com'];
        const customerDetails = [
            { name: "John Customer", email: 'john@example.com', phone: "+1 234 567 8901", company: "Customer Company A", outstanding: 250.50 },
            { name: "Sarah Smith", email: 'sarah@example.com', phone: "+1 234 567 8902", company: "Customer Company B", outstanding: 0 },
            { name: "Mike Johnson", email: 'mike@example.com', phone: "+1 234 567 8903", company: "Customer Company C", outstanding: 1250.75 }
        ];
        
        for (const details of customerDetails) {
            const existingCustomer = await user.findOne({ email: details.email });
            if (!existingCustomer) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                const newCustomer = new user({
                    name: details.name,
                    email: details.email,
                    password: hashedPassword,
                    address: "123 Main St, City, State",
                    phone: details.phone,
                    company: details.company,
                    role: "customer",
                    status: "active",
                    outstandingAmount: details.outstanding
                });
                await newCustomer.save();
                console.log(`Customer ${details.name} created successfully`);
            } else {
                console.log(`Customer ${details.email} already exists`);
            }
        }
        
        console.log("All seed operations completed successfully");
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}    

register();
import connectDB from '../db/connection.js';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env
try {
    const envPath = resolve('.env');
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                const value = line.substring(equalIndex + 1).trim();
                if (key && value) process.env[key] = value;
            }
        }
    });
    console.log('Loaded .env');
} catch (err) {
    console.error('Failed to load .env', err.message);
}

const run = async () => {
    try {
        await connectDB();

        const customerDetails = [
            { name: 'John Customer', email: 'john@example.com', phone: '+1 234 567 8901', company: 'Customer Company A', outstanding: 250.50 },
            { name: 'Sarah Smith', email: 'sarah@example.com', phone: '+1 234 567 8902', company: 'Customer Company B', outstanding: 0 },
            { name: 'Mike Johnson', email: 'mike@example.com', phone: '+1 234 567 8903', company: 'Customer Company C', outstanding: 1250.75 }
        ];

        for (const details of customerDetails) {
            const existing = await User.findOne({ email: details.email });
            if (!existing) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                const newCustomer = new User({
                    name: details.name,
                    email: details.email,
                    password: hashedPassword,
                    address: '123 Main St, City, State',
                    phone: details.phone,
                    company: details.company,
                    role: 'customer',
                    status: 'active',
                    outstandingAmount: details.outstanding
                });
                await newCustomer.save();
                console.log(`Created customer ${details.email}`);
            } else {
                console.log(`Customer ${details.email} already exists`);
            }
        }

        console.log('Customer creation complete');
        process.exit(0);
    } catch (error) {
        console.error('Error creating customers:', error);
        process.exit(1);
    }
};

run();

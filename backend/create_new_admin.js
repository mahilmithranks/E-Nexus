import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = '9923008137@klu.ac.in';
        const adminPassword = '07012006'; // Will be hashed by pre-save hook if creating new, or need to handle if updating

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.password = adminPassword;
            existingAdmin.role = 'admin';
            existingAdmin.name = 'Admin 2';
            await existingAdmin.save();
            console.log('Admin updated.');
        } else {
            console.log('Creating new admin...');
            await User.create({
                name: 'Admin 2',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                department: 'Administration',
                yearOfStudy: '4',
                registerNumber: 'ADMIN002'
            });
            console.log('Admin created.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();

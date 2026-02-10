import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const addTestUser = async () => {
    try {
        await connectDB();

        const userData = {
            name: 'test user',
            registerNumber: '9999999999',
            email: '9999999999@klu.ac.in',
            password: '11111',
            role: 'student',
            yearOfStudy: '4',
            department: 'CSE'
        };

        const existingUser = await User.findOne({
            $or: [
                { email: userData.email },
                { registerNumber: userData.registerNumber }
            ]
        });

        if (existingUser) {
            console.log('User already exists, updating...');
            existingUser.password = userData.password;
            existingUser.name = userData.name;
            await existingUser.save();
        } else {
            await User.create(userData);
            console.log('User created successfully');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addTestUser();

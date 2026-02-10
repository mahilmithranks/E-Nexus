import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Day from './models/Day.js';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const testQuery = async () => {
    try {
        await connectDB();
        console.log('Connected.');

        console.log('Querying Days...');
        const days = await Day.find().sort({ dayNumber: 1 });
        console.log(`Found ${days.length} days.`);

        console.log('Querying Students...');
        const students = await User.countDocuments({ role: 'student' });
        console.log(`Found ${students} students.`);

        process.exit(0);
    } catch (error) {
        console.error('Test Query Failed:', error);
        process.exit(1);
    }
};

testQuery();

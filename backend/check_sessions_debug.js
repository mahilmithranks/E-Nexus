import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Session from './models/Session.js';
import Day from './models/Day.js';
import connectDB from './config/db.js';

dotenv.config();

const checkSessions = async () => {
    try {
        await connectDB();

        const sessions = await Session.find().populate('dayId');
        console.log('--- Session Report ---');
        sessions.forEach(s => {
            console.log(`Title: ${s.title}`);
            console.log(`  Day: ${s.dayId?.dayNumber}`);
            console.log(`  Open: ${s.attendanceOpen}`);
            console.log(`  Start: ${s.attendanceStartTime}`);
            console.log(`  End: ${s.attendanceEndTime}`);
            console.log(`  Now: ${new Date()}`);
            console.log(`  Past End: ${s.attendanceEndTime && new Date() > new Date(s.attendanceEndTime)}`);
            console.log(`  Logic Condition Check (Start && End && Now > End): ${!!(s.attendanceStartTime && s.attendanceEndTime && new Date() > new Date(s.attendanceEndTime))}`);
            console.log('---------------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkSessions();

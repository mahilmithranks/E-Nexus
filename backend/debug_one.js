import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Session from './models/Session.js';
import connectDB from './config/db.js';

dotenv.config();

const checkOne = async () => {
    try {
        await connectDB();
        const s = await Session.findOne({ title: 'Assessment' });
        if (s) {
            console.log('SESSION_DATA_START');
            console.log(JSON.stringify({
                title: s.title,
                attendanceStartTime: s.attendanceStartTime,
                attendanceEndTime: s.attendanceEndTime,
                attendanceOpen: s.attendanceOpen,
                now: new Date().toISOString()
            }, null, 2));
            console.log('SESSION_DATA_END');
        } else {
            console.log('Session not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkOne();

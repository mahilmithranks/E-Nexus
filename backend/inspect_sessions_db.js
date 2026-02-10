import mongoose from 'mongoose';
import dotenv from 'dotenv';
import './models/Day.js';
import Session from './models/Session.js';

dotenv.config();

const inspectSessions = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const sessions = await Session.find().populate('dayId');
        for (const s of sessions) {
            console.log(`TITLE: ${s.title} | TYPE: ${s.type} | DAY: ${s.dayId?.dayNumber}`);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspectSessions();

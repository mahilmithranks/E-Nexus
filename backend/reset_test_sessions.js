import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Session from './models/Session.js';
import connectDB from './config/db.js';

dotenv.config();

const resetSessions = async () => {
    try {
        await connectDB();

        // Reset sessions that were started but shouldn't be "Absent" yet
        // We'll clear the attendance startTime and endTime
        const titles = [
            'Introduction, Commands, CLI, Repo',
            'Assessment',
            'Assessmentpilot'
        ];

        const result = await Session.updateMany(
            { title: { $in: titles } },
            {
                $set: {
                    attendanceOpen: false,
                    attendanceStartTime: null,
                    attendanceEndTime: null
                }
            }
        );

        console.log(`Successfully reset ${result.modifiedCount} sessions.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetSessions();

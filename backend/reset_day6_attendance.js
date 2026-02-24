import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Day = mongoose.model('Day', new mongoose.Schema({
    dayNumber: Number,
    title: String,
    status: String
}, { timestamps: true }));

const Session = mongoose.model('Session', new mongoose.Schema({
    dayId: mongoose.Schema.Types.ObjectId,
    title: String,
    attendanceOpen: Boolean,
    attendanceStartTime: Date,
    attendanceEndTime: Date
}, { timestamps: true }));

const Attendance = mongoose.model('Attendance', new mongoose.Schema({
    sessionId: mongoose.Schema.Types.ObjectId,
    registerNumber: String
}, { timestamps: true }));

const resetDay6Session1 = async () => {
    await connectDB();

    const sessionId = '6989c239ba1df93052100563';
    const dayId = '6989c238ba1df9305210053d';

    console.log('--- STARTING RESET PROCESS ---');

    // 1. Remove Attendance records
    const deletedAttendance = await Attendance.deleteMany({ sessionId: sessionId });
    console.log(`- Deleted ${deletedAttendance.deletedCount} attendance records for session "${sessionId}" (Frontend).`);

    // 2. Reset Session status
    const updatedSession = await Session.findByIdAndUpdate(sessionId, {
        $set: {
            attendanceOpen: false,
            attendanceStartTime: null,
            attendanceEndTime: null
        }
    }, { new: true });

    if (updatedSession) {
        console.log(`- Reset Session "${updatedSession.title}" (ID: ${sessionId}) attendance status.`);
    } else {
        console.log(`- FAILED to find Session (ID: ${sessionId}).`);
    }

    // 3. Ensure Day is OPEN (so they can restart)
    const updatedDay = await Day.findByIdAndUpdate(dayId, {
        $set: { status: 'OPEN' }
    }, { new: true });

    if (updatedDay) {
        console.log(`- Set Day ${updatedDay.dayNumber} ("${updatedDay.title}") status to "OPEN".`);
    } else {
        console.log(`- FAILED to find Day (ID: ${dayId}).`);
    }

    console.log('--- RESET PROCESS COMPLETED ---');
    console.log('You can now restart the attendance for Day 6 Session 1 (Frontend) from the Admin panel.');

    process.exit(0);
};

resetDay6Session1();

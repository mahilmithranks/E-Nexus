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
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Day = mongoose.model('Day', new mongoose.Schema({ dayNumber: Number, title: String }));
const Session = mongoose.model('Session', new mongoose.Schema({ dayId: mongoose.Schema.Types.ObjectId, title: String }));

const checkDay6 = async () => {
    await connectDB();
    const day6 = await Day.findOne({ dayNumber: 6 });
    if (day6) {
        console.log(`Day 6: ${day6.title} (ID: ${day6._id})`);
        const sessions = await Session.find({ dayId: day6._id });
        sessions.forEach(s => console.log(`- Session: "${s.title}" (ID: ${s._id})`));
    } else {
        console.log('Day 6 not found');
        // List all days just in case
        const allDays = await Day.find().sort({ dayNumber: 1 });
        allDays.forEach(d => console.log(`- Day ${d.dayNumber}: ${d.title}`));
    }
    process.exit(0);
};

checkDay6();

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
        process.exit(1);
    }
};

const Day = mongoose.model('Day', new mongoose.Schema({ dayNumber: Number, title: String }));

const checkDay = async () => {
    await connectDB();
    const day = await Day.findById('6989c238ba1df9305210053d').lean();
    if (day) {
        console.log('Day info:', JSON.stringify(day, null, 2));
    } else {
        console.log('Day not found');
    }
    process.exit(0);
};

checkDay();

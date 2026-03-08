import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Session from './models/Session.js';

const listTitles = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const sessions = await Session.find({}, 'title');
        console.log('--- SESSIONS ---');
        sessions.forEach(s => console.log(s.title));
        console.log('--- END ---');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

listTitles();

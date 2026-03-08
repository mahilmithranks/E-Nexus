import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Session from './models/Session.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const sessions = await Session.find({}, 'title startTime endTime description');
        fs.writeFileSync('sessions_raw.json', JSON.stringify(sessions, null, 2));
        console.log('Written sessions_raw.json');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();

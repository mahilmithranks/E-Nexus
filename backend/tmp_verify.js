import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Session from './models/Session.js';

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const sessions = await Session.find({ 
            $or: [
                { title: /linux/i },
                { title: /Assessment/i },
                { title: /Customization/i }
            ]
        }, 'title startTime endTime description assignments').lean();
        
        console.log(JSON.stringify(sessions, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();

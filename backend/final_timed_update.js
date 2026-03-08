import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Session from './models/Session.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const updates = [
            // Linux Block: 9am - 12pm
            { id: "69a6a915cb7a8d92b85b13ac", start: "03:30", end: "04:30", clearAssess: true }, // Intro: 9-10
            { id: "69a6a915cb7a8d92b85b13ad", start: "04:30", end: "05:30", clearAssess: true }, // Commands: 10-11
            { id: "69a6a915cb7a8d92b85b13ae", start: "05:30", end: "06:30", clearAssess: true }, // Foundations: 11-12
            
            // Lunch: 12pm - 1pm
            { id: "69a6a915cb7a8d92b85b13ab", start: "06:30", end: "07:30", clearAssess: true },
            
            // n8n Block: 1pm - 5pm
            { id: "69a6a915cb7a8d92b85b13a7", start: "07:30", end: "08:30", clearAssess: true }, // 1-2
            { id: "69a6a915cb7a8d92b85b13a8", start: "08:30", end: "09:30", clearAssess: true }, // 2-3
            { id: "69a6a915cb7a8d92b85b13a9", start: "09:30", end: "10:30", clearAssess: true }, // 3-4
            { id: "69a6a915cb7a8d92b85b13aa", start: "10:30", end: "11:30", clearAssess: true }, // 4-5
            
            // Final Assessment: 5pm - 6pm
            { id: "69a6a915cb7a8d92b85b13af", start: "11:30", end: "12:30", clearAssess: false } // 5-6
        ];

        for (const up of updates) {
            const setObj = {
                startTime: new Date(`2026-03-08T${up.start}:00.000Z`),
                endTime: new Date(`2026-03-08T${up.end}:00.000Z`)
            };
            if (up.clearAssess) {
                setObj.assignments = [];
            }
            
            const res = await Session.updateOne({ _id: up.id }, { $set: setObj });
            console.log(`Updated ${up.id}: ${res.modifiedCount} documents modified`);
        }

        console.log('Update Complete');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();

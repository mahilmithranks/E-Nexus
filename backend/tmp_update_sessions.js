import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Day from './models/Day.js';
import Session from './models/Session.js';

const updateSessions = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Find matches
        const intro = await Session.findOne({ title: /Introduction and setup Windows subsystem for Linux/i });
        const commands = await Session.findOne({ title: /Linux Commands and package manager/i });
        const assessment = await Session.findOne({ title: /^Assessment$/i }); // Strict match for final assessment
        const customization = await Session.findOne({ title: /Customization, Debugging & Wrap-up/i });

        const updateSess = async (sess, startH, startM, endH, endM, desc, removeAssignments = false) => {
            if (!sess) return;
            console.log(`Updating ${sess.title}...`);
            const start = new Date('2026-03-08T00:00:00Z');
            start.setHours(startH - 5, startM - 30, 0); // Convert to UTC (assuming IST +5:30)
            const end = new Date('2026-03-08T00:00:00Z');
            end.setHours(endH - 5, endM - 30, 0);

            sess.startTime = start;
            sess.endTime = end;
            if (desc) sess.description = desc;
            if (removeAssignments) sess.assignments = [];
            
            try {
                await sess.save();
                console.log(`✅ Saved ${sess.title}`);
            } catch (err) {
                console.error(`❌ Error saving ${sess.title}:`, err.message);
            }
        };

        // 1. Intro: 9 am to 12 pm
        await updateSess(intro, 9, 0, 12, 0, 'Setting up WSL and basic Linux environment on Windows.', true);

        // 2. Linux Commands: Merged into block or sequential. Let's put it after or as part of.
        // If the user wants 9-12 for "linux", maybe they all share that block or follow it.
        // "Introduction... 9-10 am", "Linux Commands... 10-11 am", "Linux Foundations 11-12 am"
        // User said: "change this linux to 9 am today 8 th march 20 to 12 pm"
        // This likely means the whole Linux block is 9-12.
        await updateSess(commands, 10, 0, 12, 0, 'Essential Linux terminal commands and managing software with apt.', true);

        // 3. Assessment: 5-6 pm
        await updateSess(assessment, 17, 0, 18, 0, 'Offline final assessment for both n8n and linux modules.', false);

        // 4. Customization: remove assessment
        await updateSess(customization, 16, 0, 17, 0, 'Advanced n8n features and troubleshooting. Complete the n8n assessment after marking attendance.', true);

        console.log('Process finished');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
};

updateSessions();

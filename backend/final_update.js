import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Day from './models/Day.js';
import Session from './models/Session.js';

const update = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const day8 = await Day.findOne({ dayNumber: 8 });
        if (!day8) {
            console.warn('Day 8 not found');
        }

        const sessions = await Session.find();
        console.log(`Found ${sessions.length} sessions`);

        for (let sess of sessions) {
            let changed = false;

            // 1. Update Linux Intro time
            if (sess.title.toLowerCase().includes('windows subsystem for linux')) {
                console.log(`Updating Intro: ${sess.title}`);
                sess.startTime = new Date('2026-03-08T03:30:00.000Z'); // 9:00 AM IST
                sess.endTime = new Date('2026-03-08T06:30:00.000Z');   // 12:00 PM IST
                sess.description = 'Setting up WSL and basic Linux environment on Windows.';
                sess.assignments = [];
                changed = true;
            }

            // 2. Update Linux Commands time
            else if (sess.title.toLowerCase().includes('linux commands and package manager')) {
                console.log(`Updating Commands: ${sess.title}`);
                sess.startTime = new Date('2026-03-08T06:30:00.000Z'); // 12:00 PM IST
                sess.endTime = new Date('2026-03-08T07:30:00.000Z');   // 1:00 PM IST
                sess.description = 'Essential Linux terminal commands and managing software with apt.';
                sess.assignments = [];
                changed = true;
            }

            // 3. Last slot Assessment
            else if (sess.title === 'Assessment' && (day8 && sess.dayId.equals(day8._id))) {
                console.log(`Updating Day 8 Assessment: ${sess.title}`);
                sess.startTime = new Date('2026-03-08T11:30:00.000Z'); // 5:00 PM IST
                sess.endTime = new Date('2026-03-08T12:30:00.000Z');   // 6:00 PM IST
                sess.description = 'Offline final assessment for both n8n and Linux modules.';
                // Keep assignments for this one (likely the form link)
                changed = true;
            }

            // 4. Customization session
            else if (sess.title.toLowerCase().includes('customization, debugging')) {
                console.log(`Updating Customization: ${sess.title}`);
                sess.assignments = [];
                sess.description = 'Advanced n8n features and troubleshooting. Mark attendance to complete.';
                changed = true;
            }

            // 5. General cleanup for any other Day 8 sessions (remove assessments if any)
            else if (day8 && sess.dayId.equals(day8._id) && sess.title !== 'Assessment') {
                if (sess.assignments && sess.assignments.length > 0) {
                    console.log(`Removing assessments from Day 8 session: ${sess.title}`);
                    sess.assignments = [];
                    changed = true;
                }
            }

            if (changed) {
                await sess.save();
                console.log('Saved.');
            }
        }

        console.log('Update successful');
        process.exit(0);
    } catch (err) {
        console.error('Final update failed:', err);
        process.exit(1);
    }
};

update();

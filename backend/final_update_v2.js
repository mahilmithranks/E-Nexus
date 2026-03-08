import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Session from './models/Session.js';
import Day from './models/Day.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB OK');

        const day8 = await Day.findOne({ dayNumber: 8 });
        const d8id = day8 ? day8._id : null;

        // 1. Linux Intro
        await Session.updateOne(
            { title: /windows subsystem for linux/i },
            {
                $set: {
                    startTime: new Date('2026-03-08T03:30:00.000Z'),
                    endTime: new Date('2026-03-08T06:30:00.000Z'),
                    description: 'Setting up WSL and basic Linux environment on Windows.',
                    assignments: []
                }
            }
        );
        console.log('Intro updated');

        // 2. Linux Commands
        await Session.updateOne(
            { title: /linux commands and package manager/i },
            {
                $set: {
                    startTime: new Date('2026-03-08T06:30:00.000Z'),
                    endTime: new Date('2026-03-08T07:30:00.000Z'),
                    description: 'Essential Linux terminal commands and managing software with apt.',
                    assignments: []
                }
            }
        );
        console.log('Commands updated');

        // 3. Assessment
        if (d8id) {
            await Session.updateOne(
                { title: /^Assessment$/i, dayId: d8id },
                {
                    $set: {
                        startTime: new Date('2026-03-08T11:30:00.000Z'),
                        endTime: new Date('2026-03-08T12:30:00.000Z'),
                        description: 'Offline final assessment for both n8n and Linux modules.'
                    }
                }
            );
            console.log('Assessment updated');
        }

        // 4. Customization
        await Session.updateOne(
            { title: /Customization, Debugging & Wrap-up/i },
            {
                $set: {
                    assignments: [],
                    description: 'Advanced n8n features and troubleshooting. Mark attendance to complete.'
                }
            }
        );
        console.log('Customization updated');

        // 5. Remove assessments from other Day 8 sessions
        if (d8id) {
            await Session.updateMany(
                { dayId: d8id, title: { $ne: 'Assessment' } },
                { $set: { assignments: [] } }
            );
            console.log('Day 8 cleanup done');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();

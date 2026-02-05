import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Day from './models/Day.js';
import Session from './models/Session.js';

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        console.log('🌱 Starting database seeding...\n');

        // Clear existing students
        await User.deleteMany({ role: 'student' });
        console.log('🧹 Cleared existing student records');

        const students = [
            {
                registerNumber: '9924005056',
                email: '9924005056@klu.ac.in',
                password: '9924005056',
                name: 'Gurru Ganesh S K',
                yearOfStudy: '1',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '9924005376',
                email: '9924005376@klu.ac.in',
                password: '9924005376',
                name: 'Gokul B',
                yearOfStudy: '1',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '99240041000',
                email: '99240041000@klu.ac.in',
                password: '99240041000',
                name: 'Lalithesh R V',
                yearOfStudy: '1',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '9924008091',
                email: '9924008091@klu.ac.in',
                password: '9924008091',
                name: 'K. Surya Sai Teja',
                yearOfStudy: '1',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '99240041374',
                email: '99240041374@klu.ac.in',
                password: '99240041374',
                name: 'Sanjai',
                yearOfStudy: '2',
                department: 'CSE',
                role: 'student'
            }
        ];

        console.log('Creating students...');
        for (const studentData of students) {
            const existing = await User.findOne({ registerNumber: studentData.registerNumber });
            if (!existing) {
                await User.create(studentData);
                console.log(`✓ Created student: ${studentData.registerNumber} - ${studentData.name}`);
            } else {
                console.log(`⊘ Student already exists: ${studentData.registerNumber}`);
            }
        }

        // Create workshop days
        const days = [
            { dayNumber: 1, title: 'Introduction to Web Development', status: 'LOCKED' },
            { dayNumber: 2, title: 'Advanced JavaScript Concepts', status: 'LOCKED' },
            { dayNumber: 3, title: 'React and Modern Frameworks', status: 'LOCKED' }
        ];

        console.log('\nCreating workshop days...');
        for (const dayData of days) {
            const existing = await Day.findOne({ dayNumber: dayData.dayNumber });
            if (!existing) {
                const day = await Day.create(dayData);
                console.log(`✓ Created Day ${day.dayNumber}: ${day.title}`);

                // Create sessions for each day
                const sessionsForDay = [
                    {
                        dayId: day._id,
                        title: `Day ${day.dayNumber} - Morning Session`,
                        description: 'Morning workshop session covering fundamental concepts',
                        assignments: [
                            {
                                title: 'Practical Exercise 1',
                                type: 'text',
                                description: 'Write a summary of what you learned'
                            },
                            {
                                title: 'Code Submission',
                                type: 'file',
                                description: 'Upload your code files'
                            }
                        ]
                    },
                    {
                        dayId: day._id,
                        title: `Day ${day.dayNumber} - Afternoon Session`,
                        description: 'Afternoon hands-on practice session',
                        assignments: [
                            {
                                title: 'Project Link',
                                type: 'link',
                                description: 'Share your project repository link'
                            }
                        ]
                    }
                ];

                for (const sessionData of sessionsForDay) {
                    await Session.create(sessionData);
                    console.log(`  ✓ Created session: ${sessionData.title}`);
                }
            } else {
                console.log(`⊘ Day ${dayData.dayNumber} already exists`);
            }
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   Students: ${students.length}`);
        console.log(`   Days: ${days.length}`);
        console.log(`   Sessions per day: 2`);
        console.log('\n🔐 Login Credentials:');
        console.log('   Admin: 99240041375 / 19012007 (Reg No / DOB)');
        console.log('   Student Example: 9924005056@klu.ac.in / 9924005056 (Email / Reg No)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedData();

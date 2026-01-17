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

        // Create sample students
        const students = [
            {
                registerNumber: '9999999991',
                password: '02022002', // 02/02/2002
                name: 'Gopal',
                yearOfStudy: '3',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '9924005056',
                password: '07042007', // 7/4/2007
                name: 'Gurru Ganesh S K',
                yearOfStudy: '1', // Defaulting to 1 as not in image
                department: 'CSE', // Defaulting to CSE
                role: 'student'
            },
            {
                registerNumber: '9924005376',
                password: '25122006', // 12/25/2006
                name: 'Gokul B',
                yearOfStudy: '1',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '99240041000',
                password: '06112006', // 11/6/2006
                name: 'Lalithesh R V',
                yearOfStudy: '1',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '9924008091',
                password: '14012007', // 1/14/2007
                name: 'K. Surya Sai Teja',
                yearOfStudy: '1',
                department: 'CSE',
                role: 'student'
            },
            {
                registerNumber: '99240041374',
                password: '25062007', // 25/06/2007
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
        console.log('   Admin: 9999999999 / 01012001 (Created on first server start)');
        console.log('   Student Example: 9999999991 / 02022002 (Gopal)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedData();

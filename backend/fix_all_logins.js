import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function fixAllStudentLogins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        const students = await usersCollection.find({ role: 'student' }).toArray();
        console.log('Total students:', students.length);

        let fixedEmail = 0;
        let fixedPassword = 0;
        let alreadyOk = 0;
        let errors = 0;

        const salt = await bcrypt.genSalt(10);

        for (const student of students) {
            try {
                const regNum = student.registerNumber;
                const expectedEmail = `${regNum.toLowerCase()}@klu.ac.in`;
                const updates = {};

                if (!student.email || student.email.trim() === '') {
                    updates.email = expectedEmail;
                    fixedEmail++;
                }

                const passwordWorks = await bcrypt.compare(regNum, student.password);
                if (!passwordWorks) {
                    updates.password = await bcrypt.hash(regNum, salt);
                    fixedPassword++;
                    console.log('Fixed password for:', regNum);
                }

                if (Object.keys(updates).length > 0) {
                    await usersCollection.updateOne({ _id: student._id }, { $set: updates });
                } else {
                    alreadyOk++;
                }
            } catch (err) {
                errors++;
                console.log('Error for', student.registerNumber, ':', err.message);
            }
        }

        console.log('--- SUMMARY ---');
        console.log('Already OK     :', alreadyOk);
        console.log('Emails fixed   :', fixedEmail);
        console.log('Passwords fixed:', fixedPassword);
        console.log('Errors         :', errors);
        console.log('Done.');

    } catch (err) {
        console.error('Fatal:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

fixAllStudentLogins();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const REGISTER_NUMBER = '99220040066';

async function fixUserLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find user by register number (case-insensitive)
        const user = await usersCollection.findOne({
            registerNumber: { $regex: new RegExp(`^${REGISTER_NUMBER}$`, 'i') }
        });

        if (!user) {
            console.log(`❌ User "${REGISTER_NUMBER}" NOT FOUND in the database.`);
            process.exit(0);
        }

        console.log('👤 User Found:');
        console.log(`   Name         : ${user.name}`);
        console.log(`   Register No. : ${user.registerNumber}`);
        console.log(`   Email in DB  : ${user.email || '(none — THIS IS THE BUG)'}`);
        console.log(`   Role         : ${user.role}`);
        console.log('');

        // Fix 1: Set the correct email (what the login form sends)
        const correctEmail = `${user.registerNumber.toLowerCase()}@klu.ac.in`;

        // Fix 2: Hash password exactly ONCE using raw collection (bypasses pre-save double-hash)
        const salt = await bcrypt.genSalt(10);
        const correctHash = await bcrypt.hash(user.registerNumber, salt);

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { email: correctEmail, password: correctHash } }
        );

        // Verify
        const isValid = await bcrypt.compare(user.registerNumber, correctHash);

        console.log(`📧 Email set to   : ${correctEmail}`);
        console.log(`🔑 Password reset : ${user.registerNumber}`);
        console.log(`🧪 bcrypt verify  : ${isValid ? '✅ PASS' : '❌ FAIL'}`);
        console.log('');
        console.log('✅ They can now log in with:');
        console.log(`   Username : ${correctEmail}  OR  ${user.registerNumber}`);
        console.log(`   Password : ${user.registerNumber}`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected.');
    }
}

fixUserLogin();

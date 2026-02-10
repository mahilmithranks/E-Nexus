import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const deleteUser = async () => {
    try {
        await connectDB();

        const registerNumber = '9988776655'; // Mahil's register number
        const result = await User.deleteOne({ registerNumber });

        if (result.deletedCount > 0) {
            console.log(`✅ Successfully deleted user with Register Number: ${registerNumber}`);
        } else {
            console.log(`⚠️ User with Register Number: ${registerNumber} not found.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        process.exit(1);
    }
};

deleteUser();

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const User = mongoose.model('User', new mongoose.Schema({
    registerNumber: String,
    name: String,
    email: String,
    role: String
}, { strict: false }));

const fixName = async () => {
    await connectDB();

    const REG_NO = '99220040389';
    const OLD_NAME = 'Devarla Sai Snathosh';
    const NEW_NAME = 'Devarla Sai Santhosh';

    console.log(`\n🔍 Looking up student with Register Number: ${REG_NO}...\n`);

    // Find the student first
    const student = await User.findOne({ registerNumber: REG_NO });

    if (!student) {
        console.log(`❌ No student found with register number: ${REG_NO}`);
        process.exit(1);
    }

    console.log(`📋 Found student:`);
    console.log(`   Name:   "${student.name}"`);
    console.log(`   Email:  ${student.email}`);
    console.log(`   Reg No: ${student.registerNumber}`);
    console.log(`   Role:   ${student.role}`);

    if (student.name === NEW_NAME) {
        console.log(`\n✅ Name is already correct ("${NEW_NAME}"). No changes needed.`);
        process.exit(0);
    }

    // Update the name
    const result = await User.updateOne(
        { registerNumber: REG_NO },
        { $set: { name: NEW_NAME } }
    );

    if (result.modifiedCount === 1) {
        console.log(`\n✅ Name successfully updated:`);
        console.log(`   Old: "${student.name}"`);
        console.log(`   New: "${NEW_NAME}"`);
        console.log(`\n📊 This change will reflect automatically in:`);
        console.log(`   - Admin Dashboard (Users list)`);
        console.log(`   - Excel Exports (Attendance, Assessments)`);
        console.log(`   - All student-related reports`);
    } else {
        console.log(`\n⚠️  Update ran but no document was modified. Check register number.`);
    }

    process.exit(0);
};

fixName();

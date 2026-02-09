import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    registerNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    email: {
        type: String,
        sparse: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    yearOfStudy: {
        type: String,
        enum: ['1', '2', '3', '4'],
        required: function () {
            return this.role === 'student';
        }
    },
    department: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add indexes for fast retrieval
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ yearOfStudy: 1 });
userSchema.index({ role: 1, department: 1, yearOfStudy: 1 });
userSchema.index({ lastActive: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


const User = mongoose.model('User', userSchema);

export default User;

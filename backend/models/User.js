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
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Add indexes for fast retrieval
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ yearOfStudy: 1 });
userSchema.index({ role: 1, department: 1, yearOfStudy: 1 });

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

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    // Otherwise increment
    const updates = { $inc: { loginAttempts: 1 } };

    // Lock the account after 5 attempts for 15 minutes
    const maxAttempts = 5;
    const lockTime = 15 * 60 * 1000; // 15 minutes

    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }

    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

const User = mongoose.model('User', userSchema);

export default User;

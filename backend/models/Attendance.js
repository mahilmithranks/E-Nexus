import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    registerNumber: {
        type: String,
        required: true,
        uppercase: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT'],
        default: 'PRESENT'
    },
    photoPath: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isOverride: {
        type: Boolean,
        default: false
    },
    overrideComment: {
        type: String,
        required: function () {
            return this.isOverride === true;
        }
    },
    overrideBy: {
        type: String // Admin email who made the override
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate attendance
attendanceSchema.index({ registerNumber: 1, sessionId: 1 }, { unique: true });
attendanceSchema.index({ sessionId: 1 });
attendanceSchema.index({ registerNumber: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;

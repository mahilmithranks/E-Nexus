import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['text', 'file', 'link'],
        required: true
    },
    description: {
        type: String,
        trim: true
    }
});

const sessionSchema = new mongoose.Schema({
    dayId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Day',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    attendanceOpen: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    attendanceStartTime: {
        type: Date
    },
    attendanceEndTime: {
        type: Date
    },
    mode: {
        type: String,
        enum: ['ONLINE', 'OFFLINE'],
        default: 'ONLINE'
    },
    type: {
        type: String,
        enum: ['SESSION', 'BREAK'],
        default: 'SESSION'
    },
    assignments: [assignmentSchema],
    isCertificateUploadOpen: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for performance
sessionSchema.index({ dayId: 1 });
sessionSchema.index({ attendanceOpen: 1 });
sessionSchema.index({ dayId: 1, attendanceOpen: 1 });
sessionSchema.index({ updatedAt: -1 });

// Method to check if attendance window is active
sessionSchema.methods.isAttendanceActive = function () {
    if (!this.attendanceOpen) return false;

    const now = new Date();
    return now >= this.attendanceStartTime && now <= this.attendanceEndTime;
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;

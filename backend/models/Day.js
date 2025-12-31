import mongoose from 'mongoose';

const daySchema = new mongoose.Schema({
    dayNumber: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['LOCKED', 'OPEN', 'CLOSED'],
        default: 'LOCKED'
    },
    date: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for fast queries
daySchema.index({ status: 1 });

const Day = mongoose.model('Day', daySchema);

export default Day;

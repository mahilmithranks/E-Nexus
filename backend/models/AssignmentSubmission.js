import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema({
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
    assignmentTitle: {
        type: String,
        required: true
    },
    assignmentType: {
        type: String,
        enum: ['text', 'file', 'link'],
        required: true
    },
    response: {
        type: String, // Can be text content, file path (legacy), or URL
        required: false // Not required if files are present
    },
    files: [{
        type: String // Array of file paths
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for fast queries
assignmentSubmissionSchema.index({ registerNumber: 1, sessionId: 1 });
assignmentSubmissionSchema.index({ sessionId: 1 });
assignmentSubmissionSchema.index({ registerNumber: 1 });

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);

export default AssignmentSubmission;

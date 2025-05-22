const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'answered', 'closed'],
        default: 'pending'
    },
    answer: {
        type: String,
        default: ''
    },
    answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accounts',
        default: null
    },
    answeredAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Question', questionSchema, "question");
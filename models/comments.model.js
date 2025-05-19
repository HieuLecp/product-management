const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    userName: String,
    content: {
        type: String,
        required: false
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    replies: [{
        user_id: {
            type: String,
            ref: 'User',
            required: true
        },
        userName: String,
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = commentSchema;
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String
    },
    content: {
        type: String,
        required: true,
    },
    sendVia: {
        type: String,
        enum: ['FCM', 'SMS', 'EMAIL', 'NOTIFICATION'],
        default: 'NOTIFICATION',
    },
    status: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expireIn: {
        type: Date,
    },
});

module.exports = mongoose.model('Notification', notificationSchema);

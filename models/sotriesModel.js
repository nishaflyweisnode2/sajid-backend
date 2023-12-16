const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    images: [
        {
            img: {
                type: String
            }
        }
    ],
    text: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: 'false',
    },
    isAdminApproved: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Story = mongoose.model('Story', storySchema);

module.exports = Story;

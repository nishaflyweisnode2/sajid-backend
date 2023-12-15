const mongoose = require('mongoose');

const gstSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
    },
    rate: {
        type: Number,
    },
    status: {
        type: Boolean,
        default: false,
    },
});

const GST = mongoose.model('GST', gstSchema);

module.exports = GST;

const mongoose = require('mongoose');

const termAndConditionSchema = new mongoose.Schema({
    header: {
        type: String,
    },
    headerContent: {
        type: String,
    },
    header1: {
        type: String,
    },
    header1Content: {
        type: String,
    },
    header2: {
        type: String,
    },
    header2Content: {
        type: String,
    },
    header3: {
        type: String,
    },
    header3Content: {
        type: String,
    },
    header4: {
        type: String,
    },
    header4Content: {
        type: String,
    },

}, { timestamps: true });

module.exports = mongoose.model('TermAndCondition', termAndConditionSchema);

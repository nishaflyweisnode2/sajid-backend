const mongoose = require('mongoose');

const termAndConditionSchema = new mongoose.Schema({
    content: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model('TermAndCondition', termAndConditionSchema);

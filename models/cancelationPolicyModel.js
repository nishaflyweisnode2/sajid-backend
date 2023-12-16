const mongoose = require('mongoose');

const cancelationPolicySchema = new mongoose.Schema({
    content: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model('CancelationPolicy', cancelationPolicySchema);

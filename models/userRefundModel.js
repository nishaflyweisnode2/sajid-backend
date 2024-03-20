const mongoose = require('mongoose');

const userDetailsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    upiId: {
        type: String,
        required: true,
        unique: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    ifscCode: {
        type: String,
        required: true
    },
    branchName: {
        type: String,
        required: true
    }
});

const UserDetails = mongoose.model('UserDetails', userDetailsSchema);

module.exports = UserDetails;

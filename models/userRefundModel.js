const mongoose = require('mongoose');

const userDetailsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    upiId: {
        type: String,
        unique: true
    },
    accountNumber: {
        type: String,
    },
    ifscCode: {
        type: String,
    },
    branchName: {
        type: String,
    }
});

const UserDetails = mongoose.model('UserDetails', userDetailsSchema);

module.exports = UserDetails;

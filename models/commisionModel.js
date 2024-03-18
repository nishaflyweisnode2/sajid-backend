const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null
    },
    commissionPercentage: {
        type: Number,
        min: 0,
        max: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Commission = mongoose.model('Commission', commissionSchema);

module.exports = Commission;

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
    },
    coordinates: {
        type: [Number],
        index: '2dsphere',
        required: true,
    },
    type: {
        type: String,
        enum: ['pickup', 'drop'],
        required: true,
    },
    address: {
        street: String,
        state: String,
        city: String,
        pincode: String,
    },
});

const LocationModel = mongoose.model('Location', locationSchema);

module.exports = LocationModel;

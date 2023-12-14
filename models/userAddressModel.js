const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({

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
        enum: ['Home', 'Work'],
        required: true,
    },
    address: {
        houseNo: String,
        street: String,
        state: String,
        city: String,
        pincode: String,
    },
});

const AddressModel = mongoose.model('Address', addressSchema);

module.exports = AddressModel;

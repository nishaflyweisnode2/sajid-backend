const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
    },
    coordinates: {
        type: [Number],
        index: '2dsphere',
    },
    type: {
        type: String,
        enum: ['Home', 'Work'],
        default: "Home"
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

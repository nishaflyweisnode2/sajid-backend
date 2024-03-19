const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
    {
        partner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        bike: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bike',
        },
        accessory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Accessory',
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
        openTime: {
            type: String,
        },
        closeTime: {
            type: String,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        userType: {
            type: String,
            enum: ["PARTNER", "FRANCHISE-PARTNER"],
            // default: "PARTNER"
        },

    },
    { timestamps: true }
);

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;

const mongoose = require('mongoose');

const bikeStoreRelationSchema = new mongoose.Schema(
    {
        bike: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bike',
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
        },
        accessory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Accessory',
        },
        totalNumberOfBikes: {
            type: Number,
            default: 0,
        },
        totalNumberOfPartnerBikes: {
            type: Number,
            default: 0,
        },
        totalNumberOfBookedBikes: {
            type: Number,
            default: 0,
        },
        totalNumberOfPartnerAccessory: {
            type: Number,
            default: 0,
        },
        totalNumberOfAccessory: {
            type: Number,
            default: 0,
        },
        totalNumberOfBookedAccessory: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const BikeStoreRelation = mongoose.model('BikeStoreRelation', bikeStoreRelationSchema);

module.exports = BikeStoreRelation;

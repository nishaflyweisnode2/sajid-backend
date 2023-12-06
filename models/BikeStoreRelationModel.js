const mongoose = require('mongoose');

const bikeStoreRelationSchema = new mongoose.Schema(
    {
        bike: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bike',
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        totalNumberOfBikes: {
            type: Number,
            default: 0,
        },
        totalNumberOfBookedBikes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const BikeStoreRelation = mongoose.model('BikeStoreRelation', bikeStoreRelationSchema);

module.exports = BikeStoreRelation;

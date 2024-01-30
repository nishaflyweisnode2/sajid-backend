const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        brand: {
            type: String,
        },
        model: {
            type: String,
        },
        images: [
            {
                img: {
                    type: String
                }
            }
        ],
        type: {
            type: String,
            enum: ['Petrol', 'Electric'],
        },
        transmission: {
            type: String,
            enum: ["Manual", "Automatic"],
            default: "Manual",
        },
        color: {
            type: String,
        },
        bikeNumber: {
            type: String,
        },
        totalKm: {
            type: Number,
        },
        engineHP: {
            type: Number,
        },
        mileage: {
            type: Number,
            default: 0,
        },
        speedLimit: {
            type: Number,
            required: true,
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        numberOfSeats: {
            type: Number,
            default: 1,
        },
        aboutBike: {
            type: String,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        depositMoney: {
            type: Number,
        },
        rentalPrice: {
            type: Number,
        },
        rentalExtendedPrice: {
            type: Number,
        },
        rentalStart: {
            type: Date,
            default: null,
        },
        rentalEnd: {
            type: Date,
            default: null,
        },
        rentalCount: {
            type: Number,
            default: 0,
        },
        isOnTrip: {
            type: Boolean,
            default: false,
        },
        subscriptionAmount: {
            type: Number,
            default: 0,
        },
        isSubscription: {
            type: Boolean,
            default: false,
        },
        pickup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
        drop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
    },
    { timestamps: true }
);

const Bike = mongoose.model('Bike', bikeSchema);

module.exports = Bike;

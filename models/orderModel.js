const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    items: [
        {
            accessory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Accessory',
            },
            quantity: {
                type: Number,
                default: 1,
            },
            price: {
                type: Number,
                default: 0,
            },
        },
    ],
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        default: 'PENDING',
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
    },
    paymentMethod: {
        type: String,
        enum: ['ONLINE', 'CASHONDILIVERY'],
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'FAILED', 'COMPLETED'],
        default: 'PENDING',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    orderOtp: {
        type: String,
        default: null,
    },
    isOrderOtp: {
        type: Boolean,
        default: false
    },
    orderDeliveredDate: {
        type: Date,
        default: null,
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

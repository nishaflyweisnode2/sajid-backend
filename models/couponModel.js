const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    desc: {
        type: String,
    },
    code: {
        type: String,
        unique: true,
    },
    discount: {
        type: Number,
    },
    isPercent: {
        type: Boolean,
        default: true,
    },
    expirationDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });


const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;

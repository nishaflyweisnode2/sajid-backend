const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    description: {
        type: Array,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccessoryCategory',
    },
    image: {
        type: String,
    },
    price: {
        type: Number,
    },
    stock: {
        type: Number,
    },
    status: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const Accessory = mongoose.model('Accessory', accessorySchema);

module.exports = Accessory;

const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    image: {
        type: String,
    },
    status: {
        type: Boolean,
        default: false
    },
});


const City = mongoose.model('City', citySchema);

module.exports = City;

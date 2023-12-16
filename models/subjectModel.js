const mongoose = require('mongoose');

const SubjectsCategorySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    status: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const SubjectsCategory = mongoose.model('Subjects', SubjectsCategorySchema);

module.exports = SubjectsCategory;

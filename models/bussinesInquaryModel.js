const mongoose = require('mongoose');

const bussinesInquarySchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Subjects',
        },
        messages: [
            {
                message: { type: String },
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reply: { type: String },
            },
        ],
    },
    { timestamps: true }
);

const BussinesInquary = mongoose.model('BussinesInquary', bussinesInquarySchema);

module.exports = BussinesInquary;

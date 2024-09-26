const mongoose = require('mongoose');

const limitSchema = new mongoose.Schema({
    limit: { type: Number, required: true },
    date:{type:String},
    createdAt: { type: Date, default: Date.now },
});

const limit = mongoose.model('Limit', limitSchema);
module.exports =limit;
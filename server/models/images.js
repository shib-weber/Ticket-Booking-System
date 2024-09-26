const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }, // Optional: to track when the image was uploaded
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;

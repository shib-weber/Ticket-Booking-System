// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true,unique:true },
    date: { type: Date, required: true },
    tickets: { type: Number, required: true },
    discountCode: { type: String },
    Token:{type:String},
    price:{type:Number},
    createdAt: { type: Date, default: Date.now },
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
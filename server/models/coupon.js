const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    uses: { type: Number, required: true },
    discount: { type: Number, required: true },
    isenabled:{type:Boolean,default:true},// discount can be in percentage or amount
    date:{type:String}, 
    createdAt: { type: Date, default: Date.now }
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;

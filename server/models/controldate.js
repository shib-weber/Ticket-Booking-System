const mongoose = require('mongoose');

const controlSchema = new mongoose.Schema({
    isenabled:{type:Boolean,default:true},// discount can be in percentage or amount
    date:{type:String}, 
    createdAt: { type: Date, default: Date.now }
});

const Control = mongoose.model('Controls', controlSchema);

module.exports = Control;

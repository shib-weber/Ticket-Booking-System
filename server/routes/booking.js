const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Limit= require('../models/limit');
const io = require('socket.io-client');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Set up nodemailer transport with your email credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'taazadandiya2024@gmail.com',
    pass: 'thet ywkh kemb pfgr',
  },
});

router.get('/', (req, res) => {
  res.render('clientf');
});

// POST: Create a new booking
router.post('/', async (req, res) => {
function generateToken(phone) {
  const day = new Date().getDate().toString().padStart(2, '0');
  const randomPart = crypto.randomBytes(2).toString('hex'); 
  const lastFourDigits = phone.slice(-4);
  const randompart1=randomPart.toUpperCase();
  return `${day}${randomPart1}${lastFourDigits}`;
}

const { name, email, phone, date, tickets, discountCode, totalAmount, razorpayPaymentId } = req.body;
const token = generateToken(phone);

const email1=email.toLowerCase();

try {
  // Create new booking if phone number is unique
  const newBooking = await Booking.create({
    name,
    email:email1,
    phone,
    date,
    tickets,
    discountCode,
    price: totalAmount,
    Token: token,
    razorpayPaymentId
  });
  try {
    const mailOptions = {
      from: 'taazadandiya2024@gmail.com', // Sender address
      to: email1, // Receiver's email
      subject: 'Taaza Dandiya 2024: Booking Confirmation',
      text: `Dear ${name},\n\nThank you for booking your tickets to Taaza Dandiya 2024!\n\nHere are your booking details:\n\n- Name: ${name}\n- Tickets: ${tickets}\n- Event Date: ${date}\n- Total Amount: ₹${totalAmount}\n- Payment ID: ${razorpayPaymentId}\n\nYour booking is confirmed! Please show this confirmation at the venue.\n\nSee you there!\n\nBest regards,\nTaaza Dandiya Team`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending confirmation email:', error);
      } else {
        console.log('Confirmation email sent:', info.response);
      }
    });
  } catch (error) {
    console.log('mail not sent: ', error);
  }
  
  res.status(201).json({ message: 'Booking successful!',
    phone,
    email,
    name,
    date,
    tickets, 
    totalAmount,
    token,
    razorpayPaymentId
   });
   const io = req.app.get('io');
   io.emit('update-ticket-stats', await Booking.aggregate([
     {
       $group: {
         _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
         tickets: { $sum: "$tickets" }
       }
     }
   ]));
 
   io.emit('update-ticket-stats2', await Booking.aggregate([
     {
       $group: {
         _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
         tickets: { $sum: "$tickets" }
       }
     }
   ]));
} catch (error) {
  console.error('Error while saving booking:', error);
  res.status(500).json({ message: 'Error while saving booking', error });
}
});

// Route to check if phone number already exists
router.get('/check-phone/:phone', async (req, res) => {
  const { phone } = req.params;
  console.log(phone);
  try {
      const existingBooking = await Booking.findOne({ phone });
      if (existingBooking) {
          return res.status(400).json({ message: 'A booking with this phone number already exists.' });
      }
      res.status(200).json({ message: 'Phone number is available.' });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
});

// Route to check if booking limit is reached
router.get('/check-limit/:date/:tickets', async (req, res) => {
  const { date, tickets } = req.params;
  try {
      const bookingSettings = await Limit.findOne({date});
      const maxBookings = bookingSettings?.limit || Infinity;

      const currentBookingsCount = await Booking.aggregate([
          { $match: { date: new Date(date) } },
          { $group: { _id: null, totalTickets: { $sum: "$tickets" } } }
      ]);

      const totalSold = currentBookingsCount[0]?.totalTickets || 0;
      const tt = Number(totalSold) + Number(tickets);

      if (tt > maxBookings) {
          return res.status(400).json({ message: 'Booking limit reached! No more available spots.' });
      }
      res.status(200).json({ message: 'Booking limit is okay.' });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
});



module.exports = router;
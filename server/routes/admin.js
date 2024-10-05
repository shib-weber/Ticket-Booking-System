const mongoose = require("mongoose");
const Admin = require("../models/admin");
const Booking = require('../models/booking')
const Limit = require('../models/limit')
const Coupon = require('../models/coupon')
const Control = require('../models/controldate')
const Image = require('../models/images')
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const dns = require('dns');
const bcrypt = require('bcryptjs');
const json2xls = require('json2xls');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
const Grid = require('gridfs-stream');
require('dotenv').config();
const cors = require('cors');

router.use(bodyParser.json());
router.use(cookieParser());
router.use(json2xls.middleware);
router.use(cors());

function TokenVerify(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('login'); 
    }
    const key = process.env.secret_key || 'hello';

    jwt.verify(token, key, (err, decoded) => {
        if (err) {
            return res.redirect('login'); 
        }
        req.user = decoded;
        next();
    });
}

router.get('/', (req, res) => {
    res.render('main');
});

router.get('/about', (req, res) => {
    res.send("Taaza Dandiya could be an event organized or broadcasted by Taaza TV");
});

function validateEmailFormat(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateEmailDomain(email) {
    return new Promise((resolve, reject) => {
        const domain = email.split('@')[1];
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

router.get('/signup', (req, res) => {
    return res.render('signup');
});

router.post('/signup', async (req, res) => {
    const email = req.body.email;

    if (!validateEmailFormat(email)) {
        return res.render('signup', { message: 'Invalid email format' });
    }

    const isValidDomain = await validateEmailDomain(email);
    if (!isValidDomain) {
        return res.render('signup', { message: 'Invalid email domain' });
    }

    const password = req.body.password;
    if (password.length < 8) {
        return res.render('signup', { message: 'Minimum 8 digit password required' });
    }

    const data = req.body;
    const allDbUsers = await Admin.find({});
    const userExists = allDbUsers.find(user => user.email === data.email);

    if (userExists) {
        return res.render('signup', { message: 'User-Email already exists' });
    } else {
        try {
            const hashedPassword = await bcrypt.hash(data.password, 10); 

            await Admin.create({
                email: data.email,
                password: hashedPassword 
            });
            return res.render('login', { message: "Try Logging in" });
        } catch (err) {
            return res.render('signup', { message: 'Email already exists' });
        }
    }
});

router.get('/login', (req, res) => {
    return res.render('login');
});

router.post('/login', async (req, res) => {
    const user = await Admin.findOne({ email: req.body.email });

    if (!user) {
        return res.render('login', { message: 'Incorrect Email or Password' });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
        return res.render('login', { message: 'Incorrect Email or Password' });
    } else {
        const key = process.env.secret_key || 'hello';
        const token = jwt.sign({ username: user.email, userid: user._id }, key, { expiresIn: '30d' });
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 
        });
        return res.redirect('home');
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('login');
});

router.get('/change-password',TokenVerify,(req,res)=>{
    res.render('change')
})

router.post('/change-password', TokenVerify, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Retrieve user ID from the token
        const userId = req.user.userid; // Ensure `userid` is correctly set in TokenVerify middleware
        const user = await Admin.findById(userId);

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }



        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: 'Password successfully changed.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});


router.get('/home', TokenVerify, async(req, res) => {
    const limits = await Limit.find({});
    const coupons=await Coupon.find({})

    res.render('home', { limits , coupons });
});

router.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const results = await Booking.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(results);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});



router.get('/ticket-stats', async (req, res) => {
    try {
        const bookings = await Booking.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    tickets: { $sum: "$tickets" }
                }
            }
        ]);
        res.json(bookings);
    } catch (err) {
        res.status(500).send("Error fetching ticket stats");
    }
});

router.get('/ticket-stats2', async (req, res) => {
    try {
        const bookings = await Booking.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    tickets: { $sum: "$tickets" }
                }
            }
        ]);
        res.json(bookings);
    } catch (err) {
        res.status(500).send("Error fetching ticket stats");
    }
});


// Route to control booking (start/stop) for a specific date
// POST route to control booking
router.post('/control-booking', async (req, res) => {
    const { action, date } = req.body; // Expect 'date' to be passed with 'action'

    if (!date || !action) {
        return res.status(400).json({ message: 'Date and action are required' });
    }

    if (!['start', 'stop'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
    }

    try {
        const update = { isenabled: action === 'start' };
        const control = await Control.findOneAndUpdate(
            { date },
            update,
            { upsert: true, new: true, runValidators: true }
        );
        const message = action === 'start' 
            ? `Booking started for ${date}` 
            : `Booking stopped for ${date}`;
        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking status', error });
    }
});

// GET route to check booking status for a specific date
router.get('/booking-status/:date', async (req, res) => {
    const { date } = req.params;

    try {
        const control = await Control.findOne({ date });
        if (!control) {
            return res.status(404).json({ message: 'No booking data for this date' });
        }
        res.json({ bookingEnabled: control.isenabled });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking status', error });
    }
});


router.get('/users', async (req, res) => {
    try {
        // Fetch users from the Booking collection, sorted first by event date (newest first) and then by ticket count (descending)
        const users = await Booking.find().sort({ date: -1, tickets: -1 }).lean(); 

        // Send the sorted list of users directly to the client
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error); // Log the error for debugging
        res.status(500).send("Error fetching users");
    }
});

router.get('/userf', async (req, res) => {
    const eventDate = req.query.eventDate;

    try {
        let users;
        if (eventDate) {
            // Convert the eventDate to a proper date format for querying
            const date = new Date(eventDate);
            users = await Booking.find({ date }); // Assuming 'date' is a field in your user schema
        } else {
            users = await Booking.find();
        }

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});



router.get('/download/excel', async (req, res) => {
    try {
        const users = await Booking.find().lean(); // Fetch user data
        res.xls('users.xlsx', users); // Export the data to Excel
    } catch (error) {
        res.status(500).send("Error exporting data to Excel");
    }
});

router.get('/download/excelCoupon', async (req, res) => {
    try {
        const users = await Coupon.find().lean(); // Fetch user data
        res.xls('coupon.xlsx', users); // Export the data to Excel
    } catch (error) {
        res.status(500).send("Error exporting data to Excel");
    }
});


router.get('/download/pdf', async (req, res) => {
    try {
        const users = await Booking.find().lean(); // Fetch user data
        const doc = new PDFDocument();
        const filePath = 'users.pdf';
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        users.forEach(user => {
            doc.text(` Event Date : ${user.date} Name:  ${user.name},Mobile no.: ${user.phone},Email: ${user.email}, Tickets: ${user.tickets}`);
            doc.moveDown();
        });

        doc.end();

        stream.on('finish', () => {
            res.download(filePath, err => {
                if (err) {
                    res.status(500).send("Error downloading the PDF");
                } else {
                    fs.unlinkSync(filePath); // Remove the file after download
                }
            });
        });
    } catch (error) {
        res.status(500).send("Error exporting data to PDF");
    }
});

router.get('/download/pdfCoupon', async (req, res) => {
    try {
        const users = await Coupon.find().lean(); // Fetch user data
        const doc = new PDFDocument();
        const filePath = 'coupons.pdf';
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        users.forEach(user => {
            doc.text(` Coupon Code : ${user.code} Valid For Date:  ${user.date}, Number of Tickets .: ${user.uses}, Discount : ${user.discount}%,`);
            doc.moveDown();
        });

        doc.end();

        stream.on('finish', () => {
            res.download(filePath, err => {
                if (err) {
                    res.status(500).send("Error downloading the PDF");
                } else {
                    fs.unlinkSync(filePath); // Remove the file after download
                }
            });
        });
    } catch (error) {
        res.status(500).send("Error exporting data to PDF");
    }
});

// Add this route to your existing router
// POST route to set max bookings for a specific date
router.post('/set-max-bookings', async (req, res) => {
    const { maxBookings, date } = req.body;

    if (!date || !maxBookings) {
        return res.status(400).json({ message: 'Date and max bookings are required.' });
    }

    try {
        // Find the limit for the specific date and update or create if not found
        await Limit.findOneAndUpdate(
            { date },
            { limit: maxBookings, date },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(200).json({ message: 'Max bookings updated successfully!' });
    } catch (error) {
        console.error('Error updating max bookings:', error);
        res.status(500).json({ message: 'Error updating max bookings', error });
    }
});

// GET route to check bookings for a specific date
router.get('/check-bookings/:date', async (req, res) => {
    const { date } = req.params;

    try {
        // Fetch booking settings for the date
        const bookingSettings = await Limit.findOne({ date });
        const maxBookings = bookingSettings?.limit || Infinity;


        const currentBookingsCount = await Booking.aggregate([
            { $match: { date: new Date(date) } },
            { $group: { _id: null, totalTickets: { $sum: "$tickets" } } }
        ]);


        const totalSold = currentBookingsCount[0]?.totalTickets || 0;

        // Prepare to respond based on the total after adding user's requested tickets
        const bookingEnabled = (totalSold  < maxBookings);

        res.status(200).json({
            currentBookings: totalSold,
            maxBookings,
            bookingEnabled,
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Error fetching bookings', error });
    }
});


  router.post('/verify-coupon', async (req, res) => {
    const { code , date } = req.body;
    
    try {
        const coupon = await Coupon.findOne({ code });

        // Check if the coupon exists
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon code OR coupon date' });
        }

        // Check if the coupon has any uses left
        if (coupon.uses <= 0) {
            return res.status(400).json({ message: 'Coupon has been exhausted.' });
        }
        if(coupon.date != date ){
            return res.status(400).json({ message: 'Not applicable for the selected date.' });
        }

        if(coupon.isenabled == false){
            return res.status(400).json({ message: 'Not Activated currently' });
        }
        // Decrement the coupon uses
        coupon.uses -= 1;
        await coupon.save(); // Ensure the updated coupon is saved

        // Return the discount amount/percentage to the frontend
        return res.status(200).json({ discount: coupon.discount });
    } catch (error) {
        console.error('Error verifying coupon:', error);
        return res.status(500).json({ message: 'Error verifying coupon' });
    }
});


router.get('/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find(); // Fetch all coupons from MongoDB
        res.json({ success: true, coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ success: false, message: 'Error fetching coupons' });
    }
});



router.post('/generate-coupons', async (req, res) => {
    const { code, uses, discount,date } = req.body;

    try {
        // Create and save the coupon
        const newCoupon = new Coupon({ code, uses, discount,date });
        await newCoupon.save();

        res.status(201).json({ success: true, coupon: newCoupon });
    } catch (error) {
        console.error('Error generating coupon:', error);
        res.status(500).json({ success: false, message: 'Error generating coupon' });
    }
});



const mongourl = process.env.MONGO_URI;
const conn = mongoose.connection;

// Initialize GridFS
let gfs, gridfsBucket;

conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads', // Same as GridFsStorage
    });
    
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads'); // Collection for files
    
    console.log('GridFS Initialized');
});

// Connect to MongoDB
mongoose.connect(mongourl)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Configure GridFsStorage
const storage = new GridFsStorage({
    url: mongourl,
    file: (req, file) => {
        if (!file.mimetype.startsWith('image/')) {
            return new Error('Invalid file type');
        }
        return {
            filename: `${Date.now()}-${file.originalname}`,
            bucketName: 'uploads',
        };
    },
});

const upload = multer({ storage });

process.on('uncaughtException',(err)=>{

    console.log('')
})
// Upload route
router.post('/upload', (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ message: 'Error uploading image' });
        }

        console.log('Request Body:', req.body); // Log the body to check for uploaded fields
        console.log('Uploaded file:', req.file); // Check what is received

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filename = req.file.filename; 
        const url = `/uploads/${filename}`;
      
        try {
            const image = new Image({ filename, url });
            await image.save();
            res.status(200).json({ message: 'Image saved successfully', filename, url });
        } catch (error) {
            console.error('Error saving image metadata:', error);
            res.status(500).json({ message: 'Image saved, but metadata error occurred' });
        }
    });
});

// Route to serve files from GridFS
router.get('/uploads/:filename', async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const readstream = gridfsBucket.openDownloadStream(file._id);
        readstream.pipe(res);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Error fetching file' });
    }
});

// Route to delete a specific image from MongoDB (GridFS)
router.delete('/delete/:filename', async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ message: 'File not found in GridFS' });
        }

        await gridfsBucket.delete(file._id); // Delete the file using GridFSBucket
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

// Route to get all uploaded images
router.get('/images', async (req, res) => {
    try {
        const files = await gfs.files.find().toArray(); // Fetch all files from GridFS
        const images = files.map(file => ({
            filename: file.filename,
            url: `/api/admin/uploads/${file.filename}`, // Construct the URL
        }));
        res.status(200).json(images);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ message: 'Error fetching images' });
    }
});

router.post('/coupons-toggle', async (req, res) => {
    const { id, isenabled } = req.body;

    try {
        // Find the coupon by ID and update the isenabled field
        const updatedCoupon = await Coupon.findOneAndUpdate(
            { _id: id },
            { isenabled: isenabled },
            { new: true }  // Return the updated document
        );

        if (updatedCoupon) {
            return res.json({ success: true, coupon: updatedCoupon });
        } else {
            return res.json({ success: false, message: 'Coupon not found' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
});

router.get('/totals', async (req, res) => {
    try {
        // Use MongoDB aggregation to calculate totals for tickets and price
        const totals = await Booking.aggregate([
            {
                $group: {
                    _id: null,  // No grouping, just calculating totals for the entire collection
                    totalTickets: { $sum: "$tickets" },  // Sum all tickets
                    totalPrice: { $sum: "$price" }        // Sum all prices
                }
            },
            {
                $project: {
                    _id: 0,              // Exclude the _id field in the result
                    totalTickets: 1,     // Include totalTickets in the output
                    totalPrice: 1        // Include totalPrice in the output
                }
            }
        ]);

        if (totals.length > 0) {
            // If aggregation returns a result
            return res.json({
                sum: totals[0].totalTickets,
                price: totals[0].totalPrice
            });
        } else {
            // If no bookings exist, return 0 for both
            return res.json({
                sum: 0,
                price: 0
            });
        }
    } catch (error) {
        console.error('Error calculating totals:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;

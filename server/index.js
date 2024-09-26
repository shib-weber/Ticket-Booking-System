const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const dotenv = require('dotenv');
const bookingRoutes = require('./routes/booking');
const adminRoute = require('./routes/admin');
const cors = require("cors");
const path = require("path")
const Booking = require('./models/booking')
const mongoose = require('mongoose');
const db = process.env.MONGO_URI;
dotenv.config();


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')))
app.use(cors());

// Routes
app.use('/api/bookings', bookingRoutes);
app.set('io', io);
app.use('/api/admin',adminRoute)

app.get('/', (req, res) => {
    res.send('TAAZA TV');
});

const getTotalTickets = async () => {
    const total = await Booking.aggregate([
        { $group: { _id: null, totalTickets: { $sum: "$tickets" } } }
    ]);
    return total.length ? total[0].totalTickets : 0;
};

// Emit total tickets sold to all clients
const emitTotalTickets = async () => {
    const totalTickets = await getTotalTickets();
    io.emit('ticketUpdate', totalTickets);
};

// Listen for new bookings and update ticket count in real-time
Booking.watch().on('change', async () => {
    await emitTotalTickets();
});

io.on('connection', async (socket) => {

    // Send current total ticket count to the newly connected client
    const totalTickets = await getTotalTickets();
    socket.emit('ticketUpdate', totalTickets);

    socket.on('disconnect', () => {
    });
});


app.set('view engine','ejs')
app.set('views', path.resolve('./views'))

const PORT = process.env.PORT || 3000;


mongoose.connect(db)
.then(res=>{console.log("Succesfully connected to MongoDB");
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/api/admin`);
    });
})
.catch(err=>{console.log("Some error occured: \n", err);})


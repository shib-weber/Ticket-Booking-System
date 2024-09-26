import React, { useState, useEffect } from 'react';
import './date.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const BookingForm = () => {
    const TICKET_PRICE = 700;
    const initialState = {
        name: '',
        email: '',
        phone: '',
        address: '',
        date: '',
        tickets: '',
        discountCode: '',
    };

    const [formData, setFormData] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [isdateEnabled, setIsdateEnabled] = useState(true);
    const [discount, setDiscount] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');
    const [isValidEmail, setIsValidEmail] = useState(true); 
     // Define selectedDate state
    const notifySuccess = (message) => toast.success(message);
    const notifyError = (message) => toast.error(message);
    // Fetch booking status based on the selected date
    const fetchBookingStatus = async (selectedDate) => {
        try {
            const response = await fetch(`http://localhost:3001/api/admin/booking-status/${selectedDate}`);
            const data = await response.json();
            setIsdateEnabled(data.bookingEnabled);
        } catch (error) {
            console.error('Error fetching booking status:', error);
        }
    };

    // Check booking status whenever a date is selected
    useEffect(() => {
        if (formData.date) {
            fetchBookingStatus(formData.date);
        }
    }, [formData.date]);

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        setFormData({ ...formData, [name]: value });
    
        // If the input is the email field, check for validity
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation regex
            setIsValidEmail(emailRegex.test(value));
        }
    };

    
    const handleDateSelect = (dateString) => {
        const date = new Date(dateString);

        const formattedDate = [
            date.getFullYear(),                               

            String(date.getDate()).padStart(2, '0')   , 
            String(date.getMonth() + 1).padStart(2, '0'),       
        ].join('-');
    
        setFormData({ ...formData, date: formattedDate });
        setSelectedDate(dateString);
    };    
    const verifyDiscountCode = async () => {
        if (formData.discountCode) {
            try {
                console.log({ code: formData.discountCode, date: formData.date });
                const response = await fetch('http://localhost:3001/api/admin/verify-coupon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: formData.discountCode, date: formData.date }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    notifyError(`Coupon error: ${result.message}`);
                    setDiscount(0);
                } else {
                    const result = await response.json();
                    setDiscount(result.discount);
                    notifySuccess(`Discount applied: ${result.discount}%`);
                }
            } catch (error) {
                console.error('Error verifying coupon:', error);
                notifyError('Failed to verify coupon, please try again.');
            }
        } else {
            notifyError('Please enter a discount code.');
        }
    };

    

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const selectedDateObj = new Date(formData.date);
        const currentDateObj = new Date();
    
        // Check if the selected date is in the past
        if (selectedDateObj < currentDateObj.setHours(0, 0, 0, 0)) {
            notifyError('The selected event date has already passed.');
            return;
        }
    
        if (!isdateEnabled) {
            notifyError('Booking is currently disabled for the selected date.');
            return;
        }
    
        // Validate required fields
        if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.tickets) {
            notifyError('Please fill all required fields.');
            return;
        }
    
        setLoading(true);
    
        try {
            // Check if phone number exists
            const phoneCheckRes = await axios.get(`http://localhost:3001/api/bookings/check-phone/${formData.phone}`);
            if (phoneCheckRes.status === 400) {
                notifyError('A booking with this phone number already exists.');
                setLoading(false);
                return;
            }
    
            // Check if booking limit is reached
            const limitCheckRes = await axios.get(`http://localhost:3001/api/bookings/check-limit/${formData.date}/${formData.tickets}`);
            if (limitCheckRes.status === 400) {
                notifyError('Booking limit reached! No more available spots.');
                setLoading(false);
                return;
            }
    
            const totalAmount = formData.tickets * TICKET_PRICE;
            const finalAmount = discount > 0 
                ? totalAmount - (totalAmount * (discount / 100)) 
                : totalAmount;
    
            const bookingData = {
                ...formData,
                totalAmount: finalAmount,
            };
            const test_key = "rzp_test_xt8VxLPKxqhMHy";
            const options = {
                key: `${test_key}`, 
                amount: `${finalAmount * 100}`, 
                currency: 'INR',
                name: 'Taaza Dandiya 2024',
                description: 'Ticket Booking Payment',
                image: 'https://taazatv.com/image/logo.webp',
                handler: async (response) => {
                    bookingData.razorpayPaymentId = response.razorpay_payment_id;
                    try {
                        const res = await axios.post('http://localhost:3001/api/bookings', bookingData);
                        if (res.status === 201) {
                            // console.log(res);
                            notifySuccess('Booking successful!')
                            console.log(`Confirmed! Booking ID ${res.data.razorpayPaymentId}. You are entitled to ${res.data.tickets} tickets dated ${res.data.date} for Taaza Dandiya @Netaji Indoor Stadium subject to clearance of payment. T&C apply. Goto the Ticket counter at venue to redeem`)
                            setFormData(initialState);
                            setDiscount(0); // Reset discount after booking
                        } else {
                            notifyError(`Error: ${res.data.message}`);
                        }
                    } catch (error) {
                        console.error('Error during booking:', error);
                        notifyError('Failed to book, please try again.');
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone,
                },
                theme: {
                    color: '#F00040',
                },
                modal: {
                    ondismiss: () => {
                        notifyError('Payment has been declined or canceled.');
                        setLoading(false);
                    },
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            notifyError(error.response.data.message);
            setLoading(false);
        }
    };
    
    
    
    return (
        <form onSubmit={handleSubmit} className='inter booking-form flex flex-col gap-3 shadow-xl border-2 border-slate-300 bg-white p-6'>
            <div className='my-3'>
            <div className="date-selection">
        <div 
            className={`date-box ${selectedDate === '10-10-2024' ? 'selected' : ''}`}
            onClick={() => handleDateSelect('10-10-2024')}
        >
            <span className="month">OCT</span>
            <span className="date">10</span>
            <span className="day">Thu</span>
        </div>
        <div 
            className={`date-box ${selectedDate === '11-10-2024' ? 'selected' : ''}`}
            onClick={() => handleDateSelect('11-10-2024')}
        >
            <span className="month">OCT</span>
            <span className="date">11</span>
            <span className="day">Fri</span>
        </div>
        <div 
            className={`date-box ${selectedDate === '12-10-2024' ? 'selected' : ''}`}
            onClick={() => handleDateSelect('12-10-2024')}
        >
            <span className="month">OCT</span>
            <span className="date">12</span>
            <span className="day">Sat</span>
        </div>
    </div>
                <div className='selected'> {selectedDate && <p className='selected-date'>Selected Date: {selectedDate}</p>} {/* Display the selected date */}</div>
            </div>

            <div className='flex gap-3'>
                <div className='flex-1'>
                    <label>No. of Tickets <span style={{ color: 'red' }}>*</span></label>
                    <input
                        type="number"
                        name="tickets"
                        value={formData.tickets}
                        onChange={handleChange}
                        min="1"
                        max="5"
                        required
                        onInput={(e) => {
                            let value = parseInt(e.target.value, 10);
                    
                            if (value > 5) {
                                value = 5; // Prevent inputting more than 5
                            }
                            if (value <= 0) {
                                value = 5; // Set to 1 if 0 or negative value is entered
                            }
                    
                            e.target.value = value; // Update the value in the input field
                        }}
                    />
                </div>
                <div className='flex-1'>
                    <label>Coupon Code</label>
                    <input type="text" name="discountCode" value={formData.discountCode} onChange={handleChange} disabled={formData.date && selectedDate && (formData.tickets)  ? false:true} title={formData.date && selectedDate && (formData.tickets) ? "Enter Coupon Code":"Please Enter Date and Number of tickets first"}/>
                </div>
                <div className='flex align-items-center pt-4'>
                    <button type='button' onClick={verifyDiscountCode} className={`btnnn ${discount===0 ? "":"disabled"}`} disabled={discount===0 ? false:true}>Verify</button>
                </div>
                
            </div>
            <div>
                <label>Name: <span style={{ color: 'red' }}>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
                <label>Mobile no.: <span style={{ color: 'red' }}>*</span></label>
                <input
                    type="tel"
                    name="phone"
                    maxLength="10"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[0-9]*" // Allows only numeric input
                    required
                    onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, ''); // Filters out non-numeric characters
                    }}
                />
            </div>
            <div>
                <label>Email Id: <span style={{ color: 'red' }}>*</span></label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    onInput={(e) => {
                        e.target.value = e.target.value.toLowerCase(); // Converts all characters to lowercase
                    }}
                />
                    {!isValidEmail && (
                        <p style={{ color: 'red' }}>Not a valid email</p>
                    )}
            </div>

            <div className='flex'>
                <div className='content-center mx-2'><input type="checkbox" required /></div>
                <div className='my-container'><label>I agree to the terms and conditions listed below.</label></div>
            </div>

            <div name='price' className='text-xl font-bold text-slate-800'>
                Total Amount: {formData.tickets * TICKET_PRICE - (discount > 0 ? (formData.tickets * TICKET_PRICE * (discount / 100)) : 0)}  {discount? (`(${discount} % Applied )`) : "" }
            </div>
            <button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Proceed To Pay'}
            </button>

            {/* Terms and conditions */}
            <p className='font-light font-xs leading-3'>1. You can book a minimum of 1 and a maximum of 5 tickets at a time.</p>
            <p className='font-light font-xs leading-3'>2. Tickets can be collected at the booking counter near the entry gate of Netaji Indoor Stadium.</p>
            <p className='font-light font-xs leading-3'>3. Only one booking allowed per phone</p>
            <p className='font-light font-xs leading-3'>4. Only paid tickets will be accepted for entry.</p>
            <p className='font-light font-xs leading-3'>5. Severe action will be taken against misconduct or mischievous behavior.</p>
            <p className='font-light font-xs leading-3'>6. Smoking and consumption of alcohol is strictly prohibited inside the venue.</p>
            <p className='font-light font-xs leading-3'>7. Individuals under the influence of alcohol will not be allowed inside the venue.</p>
            <p className='font-light font-xs leading-3'>8. Entry ticket is required for children above 3 years of age.</p>
            <p className='font-light font-xs leading-3'>9. Outside eatables and water are not allowed.</p>
            <p className='font-light font-xs leading-3'>10. Scissors, knives, blades, or any other objectionable instruments are not allowed.</p>
            <p className='font-light font-xs leading-3'>11. Every individual must undergo security checks and frisking before entering.</p>
            <p className='font-light font-xs leading-3'>12. The program is subject to the Force Majeure clause.</p>
            <p className='font-light font-xs leading-3'>13. The program is liable to change at the organizer's discretion.</p>
            <p className='font-light font-xs leading-3'>14. Dandiya sticks and food are available for purchase until stocks last.</p>
            <p className='font-light font-xs leading-3'>15. Re-entry is not allowed once you exit the venue.</p>
        </form>
    );
};

export default BookingForm;
import BookingForm from "./booking-form";
import { ToastContainer } from 'react-toastify';

export default function BookingPage(){
    return(
        <div className="h-screen w-screen overflow-hidden flex flex-col gap-4 p-6 py-10" id="ticket-booking-form ">
            <ToastContainer />
            <h1 className="text-center text-4xl font-bold text-pink-800 drop-shadow-2xl">Taaza Dandiya 2024 Ticket Booking</h1>
            <div className="m-auto overflow-y-auto">
            <BookingForm />
            </div>
        </div>
    )
}
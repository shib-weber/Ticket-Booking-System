import { Link } from "react-router-dom";
import Home1 from "../assests/dandiyalogo.png";
import "./home.css";
import Navbar from "./navbar";
import Foot from "./footer";
import Home3 from "../assests/fronpic.jpg";
import Crousel from "./slider.js";

export default function Home() {
  return (
    <div className="h-[100vh] flex flex-col min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="h-[100vh] flex flex-wrap justify-center">
        <div className="flex-1 grid place-content-center p-6 sm:px-3 sm:py-3 md:px-5 md:py-5">
          <div className="fronpic-container">
            <img src={Home3} alt="home" className="absolute object-cover fron-pic" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left logo">
          <img src={Home1} alt="home" className="relative  hero-sec" />
          <div className="flex gap-4 justify-center md:justify-start btn-box ">
            <Link
              to={"/get-tickets"}
              className="border-2 border-dashed bg-pink-700 py-3 px-5 text-sm sm:text-md md:text-lg btn-book font-semibold text-white"
            >
              Book Ticket
            </Link>
          </div>
          <div className="herosection-desc mt-4 text-sm sm:text-md md:text-lg">
            <p>Taaza Dandiya 2024 – Celebrate 15 Years of Dance, Music, & Fun | Navratri 2024</p>
          </div>
        </div>
      </div>

      <div className="h-[90vh] flex flex-col md:flex-row divide-x">
        <div className="flex-1 relative">
          <Crousel />
        </div>
        <div className="flex-1 grid place-content-center p-6 px-4 sm:px-6 md:px-10">
          <div className="flex-1 relative"></div>
          <div className="event-desc">
            <h1 className="font-bold text-center md:text-center text-slate-800 text-2xl sm:text-3xl md:text-4xl leading-[3rem]">
              The Event Details
            </h1>
            <p className="mt-4 text-center md:text-left text-sm sm:text-md md:text-lg">
              Taaza Dandiya 2024 is set to take place from October 10th to 12th at the Netaji Indoor Stadium, Kolkata. It promises an unforgettable experience, with a lineup that includes sensational artists, exciting contests with fantastic prizes, and the biggest dance floor in East India.
              Be part of this grand celebration and book your tickets now. Join the rhythm, embrace the culture, and get ready to dance your heart out at Taaza Dandiya 2024!
            </p>
          </div>
        </div>
      </div>

      <Foot />
    </div>
  );
}

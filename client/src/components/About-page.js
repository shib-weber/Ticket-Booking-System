import React from 'react';
import './about.css';

const Aboutpage = () => {
    return (
        <div className="container">
            <header>
                <h1>Join Eastern India’s BIGGEST Dandiya Event!</h1>
            </header>

            <section className="event-details">
                <h2>Where: Netaji Indoor Stadium</h2>
                <h3>When: 3 nights of non-stop festivities</h3>
                <h4>Dance to the beats of:</h4>
                <ul>
                    <li>Keyur-Nayan Mehta</li>
                    <li>DJ Akash Rohira</li>
                </ul>
                <h4>Exciting contests and prizes await!</h4>
            </section>

            <section className="highlights">
                <h3>Key Highlights:</h3>
                <ul>
                    <li>100% Rainproof Venue</li>
                    <li>Family-Friendly & Safe</li>
                    <li>Dandiya Sticks Available at the Venue</li>
                </ul>
            </section>

            <section className="venue-location">
                <h3>Venue Location:</h3>
                <p>Netaji Indoor Stadium, Maidan, B.B.D. Bagh, Kolkata, West Bengal 700021, India</p>
                <a 
                    href="https://www.google.com/maps/place/Netaji+Indoor+Stadium/@22.5670879,88.3382971,17z/data=!3m1!4b1!4m6!3m5!1s0x3a02779efd7f4425:0x7cfcd63857ef0d4f!8m2!3d22.567083!4d88.340872!16s%2Fg%2F11bycdyh8q?entry=ttu&g_ep=EgoyMDI0MDkxOC4xIKXMDSoASAFQAw%3D%3D" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="map-link"
                >
                    View on Map
                </a>
            </section>
        </div>
    );
};

export default Aboutpage ;

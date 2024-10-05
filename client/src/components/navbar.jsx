import { Link } from "react-router-dom";
import LogoImg from  "../assests/webtech.png";
import "./navbar.css"

export default function Navbar(){
    return(
        <nav className="p-3 px-10 border flex items-center justify-between bg-green-500 shadow-md shadow-green-300">
            <Logo />
            <div className="inter flex items-center list-none gap-6 nav-items">
                <li><a href={"#"} className="text-xl text-white">Home</a> </li>
                <li><a href={"/about"} className="text-xl text-white">About</a></li>
                {/* <li><a href="#contact" className="text-xl text-white">Contact Us</a></li> */}
                <Link to={"/get-tickets"} className="text-xl text-white">Book Tickets</Link>
            </div>
        </nav>
    )
}
export function Logo(){
    return(
        <img src={LogoImg} alt="logo" className="h-14 object-contain tazza-logo" />
    )
}
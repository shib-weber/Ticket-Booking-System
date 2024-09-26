import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './slider.css';

const Crousel = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch images from the server
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/admin/images');
        setUploadedImages(res.data);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  // Function to go to the next slide
  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      uploadedImages.length > 0 && prevIndex === uploadedImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Automatically change slides every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000); // 6000ms = 6s

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [currentIndex, uploadedImages]);

  return (
    <div className="App">
      <div className="carousel-container">
        {uploadedImages.length > 0 ? (
          <img
            src={`http://localhost:3001${uploadedImages[currentIndex].url}`}
            alt="carousel slide"
            className="carousel-image"
          />
        ) : (
          <p>No images to display</p>
        )}
      </div>
    </div>
  );
};

export default Crousel;

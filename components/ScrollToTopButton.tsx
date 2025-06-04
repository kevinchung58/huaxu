import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from './icons'; // Assuming this is created

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-sky-600 text-white p-4 rounded-full shadow-lg
            transition-all duration-300
            hover:bg-sky-700 hover:shadow-xl hover:scale-105
            focus:bg-sky-700 focus:shadow-xl focus:scale-105"
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;

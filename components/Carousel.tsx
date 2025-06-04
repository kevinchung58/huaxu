
import React, { useState, useEffect, useCallback } from 'react';
import { CarouselSlide } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons'; // Assuming these are created

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number; // in milliseconds, 0 to disable
}

const Carousel: React.FC<CarouselProps> = ({ slides, autoPlayInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, slides.length]);

  const goToNext = useCallback(() => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, slides.length]);

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  useEffect(() => {
    if (autoPlayInterval && autoPlayInterval > 0 && slides.length > 1) {
      const timer = setTimeout(goToNext, autoPlayInterval);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, autoPlayInterval, slides.length]); // Rerun if currentIndex or autoPlayInterval changes

  if (!slides || slides.length === 0) {
    return <div className="text-center p-4 text-slate-600">No slides to display.</div>;
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-video overflow-hidden rounded-lg shadow-xl group">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
            <img
              src={slide.imageUrl}
              alt={slide.caption || `Slide ${slide.id}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {slide.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-slate-800 bg-opacity-70 text-slate-100 p-3 text-sm md:text-base">
                {slide.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-slate-700 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-slate-700 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicators */}
      {slides.length > 1 && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {slides.map((_, slideIndex) => (
            <button
                key={slideIndex}
                onClick={() => goToSlide(slideIndex)}
                className={`w-3 h-3 rounded-full transition-colors ${
                currentIndex === slideIndex ? 'bg-sky-600' : 'bg-slate-400 hover:bg-slate-300'
                }`}
                aria-label={`Go to slide ${slideIndex + 1}`}
            />
            ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;

import React, { useCallback, useEffect, useState } from 'react';
import { CarouselSlide } from '../types';
import { asset } from '../src/lib/assets';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
}

const Carousel: React.FC<CarouselProps> = ({ slides, autoPlayInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((index) => (index === 0 ? slides.length - 1 : index - 1));
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((index) => (index === slides.length - 1 ? 0 : index + 1));
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlayInterval || slides.length <= 1) return;
    const timer = window.setTimeout(goToNext, autoPlayInterval);
    return () => window.clearTimeout(timer);
  }, [currentIndex, autoPlayInterval, slides.length, goToNext]);

  if (!slides.length) {
    return null;
  }

  return (
    <div className="group relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-lift)]">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative h-full w-full flex-shrink-0">
            <img
              src={asset(slide.imageUrl)}
              alt={slide.alt || slide.caption || 'Activity photo'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {slide.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-primary/75 px-4 py-3 text-sm text-white">
                {slide.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer rounded-full bg-primary/60 p-2 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-primary focus:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full bg-primary/60 p-2 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-primary focus:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(slideIndex)}
                className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-colors duration-200 ${
                  currentIndex === slideIndex ? 'bg-accent' : 'bg-white/70 hover:bg-white'
                }`}
                aria-label={`Go to slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Carousel;

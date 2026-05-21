import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { testimonials } from '../../constants/testimonials';
import TestimonialCard from './TestimonialCard';

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const getResponsiveWidth = () => {
  const w = window.innerWidth;
  if (w > 1100) return 760;
  const singlePadding = clamp(w * 0.04, 16, 32);
  const totalPadding = singlePadding * 2;
  const computedWidth = w - totalPadding;
  return clamp(computedWidth, 280, 760);
};

export function TestimonialSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const lastIndex = testimonials.length - 1;
  const sliderRef = useRef(null);
  const [slideWidth, setSlideWidth] = useState(getResponsiveWidth());

  useEffect(() => {
    const updateSlideWidth = () => {
      setSlideWidth(getResponsiveWidth());
    };

    updateSlideWidth();
    window.addEventListener('resize', updateSlideWidth);
    return () => window.removeEventListener('resize', updateSlideWidth);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((currentIndex) => (currentIndex === 0 ? lastIndex : currentIndex - 1));
  }, [lastIndex]);

  const showNext = useCallback(() => {
    setActiveIndex((currentIndex) => (currentIndex === lastIndex ? 0 : currentIndex + 1));
  }, [lastIndex]);

  useEffect(() => {
    if (isPaused) return undefined;
    const intervalId = window.setInterval(showNext, 4200);
    return () => window.clearInterval(intervalId);
  }, [isPaused, showNext]);

  return (
    <>
      <div
        ref={sliderRef}
        className="testimonial-slider"
        aria-label="Customer testimonial slider"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <div
          className="testimonial-track"
          style={{ transform: `translateX(-${activeIndex * slideWidth}px)` }}
        >
          {testimonials.map((testimonial) => (
            <TestimonialCard 
              key={testimonial.name} 
              testimonial={testimonial} 
              style={{ width: slideWidth }}
            />
          ))}
        </div>
      </div>
      <button
        className="testimonial-nav testimonial-prev"
        type="button"
        aria-label="Previous testimonial"
        onClick={showPrevious}
      >
        <ChevronLeft size={26} />
      </button>
      <button
        className="testimonial-nav testimonial-next"
        type="button"
        aria-label="Next testimonial"
        onClick={showNext}
      >
        <ChevronRight size={26} />
      </button>
      <div className="dots" aria-label="Select testimonial">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.name}
            type="button"
            className={index === activeIndex ? 'active' : ''}
            aria-label={`Show testimonial ${index + 1}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </>
  );
}

export default TestimonialSlider;


import React from 'react';
import { Star } from 'lucide-react';
import { assets } from '../../constants/assets';

export function TestimonialCard({ testimonial, style }) {
  return (
    <article className="testimonial-card" style={style}>
      <img src={assets.person} alt={testimonial.name} />
      <span className="quote-mark">"</span>
      <div className="stars" aria-label="5 stars">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={18} fill="currentColor" />
        ))}
      </div>
      <p>{testimonial.quote}</p>
      <h3>{testimonial.name}</h3>
      <span>{testimonial.role}</span>
    </article>
  );
}

export default TestimonialCard;


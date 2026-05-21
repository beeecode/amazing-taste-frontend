import React, { useState } from 'react';
import { X, CheckCircle, Calendar, Clock, Users, Utensils } from 'lucide-react';

const getLocalTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function ReservationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    time: '',
    guests: '2',
    seating: 'Cozy Corner',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setBookingRef('BF-' + Math.floor(100000 + Math.random() * 900000));
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-header">
              <h2>Reserve a Table</h2>
              <p>Experience exquisite dining. Book your table below.</p>
            </div>

            <div className="form-group">
              <label htmlFor="res-name">Full Name</label>
              <input
                type="text"
                id="res-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ama Annan"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="res-email">Email Address</label>
              <input
                type="email"
                id="res-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ama@example.com"
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="res-date">
                  <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Date
                </label>
                <input
                  type="date"
                  id="res-date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={errors.date ? 'input-error' : ''}
                  min={getLocalTodayString()}
                />
                {errors.date && <span className="error-message">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="res-time">
                  <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Time
                </label>
                <select
                  id="res-time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={errors.time ? 'input-error' : ''}
                >
                  <option value="">Select time</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="1:00 PM">1:00 PM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="5:00 PM">5:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                  <option value="9:00 PM">9:00 PM</option>
                </select>
                {errors.time && <span className="error-message">{errors.time}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="res-guests">
                  <Users size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Guests
                </label>
                <select id="res-guests" name="guests" value={formData.guests} onChange={handleChange}>
                  <option value="1">1 Person</option>
                  <option value="2">2 People</option>
                  <option value="3">3 People</option>
                  <option value="4">4 People</option>
                  <option value="5">5 People</option>
                  <option value="6">6 People</option>
                  <option value="8">8 People</option>
                  <option value="10">10+ People</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="res-seating">
                  <Utensils size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Seating Preference
                </label>
                <select id="res-seating" name="seating" value={formData.seating} onChange={handleChange}>
                  <option value="Cozy Corner">Cozy Corner</option>
                  <option value="Window View">Window View</option>
                  <option value="Chef's Counter">Chef's Counter</option>
                  <option value="Outdoor Patio">Outdoor Patio</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="res-notes">Special Notes (Optional)</label>
              <textarea
                id="res-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Allergies, birthday celebration, dietary restrictions..."
                rows="2"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Securing reservation...' : 'Confirm Booking'}
            </button>
          </form>
        ) : (
          <div className="success-container">
            <div className="success-icon-wrap">
              <CheckCircle size={64} className="success-checkmark" />
            </div>
            <h2>Reservation Confirmed!</h2>
            <p className="success-subtitle">
              We look forward to hosting you at Belle Restaurant.
            </p>

            <div className="success-details">
              <div className="detail-item">
                <span>Reference Code</span>
                <strong>{bookingRef}</strong>
              </div>
              <div className="detail-item">
                <span>Guest(s)</span>
                <strong>{formData.guests} {formData.guests === '1' ? 'Person' : 'People'}</strong>
              </div>
              <div className="detail-item">
                <span>Date & Time</span>
                <strong>{formData.date} at {formData.time}</strong>
              </div>
              <div className="detail-item">
                <span>Table Location</span>
                <strong>{formData.seating}</strong>
              </div>
            </div>

            <button className="done-btn" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationModal;

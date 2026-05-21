import React from 'react';
import Logo from '../common/Logo';
import Socials from '../common/Socials';

export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-brand">
        <Logo className="logo-footer" />
        <p>
          A modern restaurant serving seasonal dishes, curated drinks, and
          warm hospitality for everyday meals and special occasions.{' '}
          <a href="#">Learn more</a>
        </p>
        <div className="footer-hours">
          <h4>Opening Hours</h4>
          <div>
            <span>Monday - Friday</span>
            <strong>8:00 am to 9:00 pm</strong>
          </div>
          <div>
            <span>Saturday</span>
            <strong>8:00 am to 9:00 pm</strong>
          </div>
          <div>
            <span>Sunday</span>
            <strong>Closed</strong>
          </div>
        </div>
      </div>

      <div className="footer-column">
        <h4>Navigation</h4>
        <a href="#menu">Menu</a>
        <a href="#about">About us</a>
        <a href="#contact">Contact us</a>
        <a href="#reviews">Reviews</a>
      </div>

      <div className="footer-column">
        <h4>Dishes</h4>
        <a href="#menu">Fish & Veggies</a>
        <a href="#menu">Tofu Chili</a>
        <a href="#menu">Egg & Cucumber</a>
        <a href="#menu">Lumpia w/Sauce</a>
      </div>

      <div className="footer-follow">
        <h4>Follow Us</h4>
        <Socials small className="footer-socials" />
      </div>

      <div className="footer-bottom">
        <p>&copy; 2022 Restaurants. All Rights Reserved. Designed by Isaac</p>
        <div>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

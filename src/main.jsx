import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// Constants
import { assets } from './constants/assets';
import { dishes } from './constants/dishes';
import { navLinks } from './constants/navLinks';

// Hooks
import { useCanvasScale } from './hooks/useCanvasScale';

// Components
import Logo from './components/common/Logo';
import Button from './components/common/Button';
import Socials from './components/common/Socials';
import Decoration from './components/common/Decoration';
import FixedHeader from './components/layout/FixedHeader';
import Footer from './components/layout/Footer';
import DishCard from './components/menu/DishCard';
import TestimonialSlider from './components/testimonials/TestimonialSlider';
import ReservationModal from './components/reservation/ReservationModal';
import DishDetailModal from './components/menu/DishDetailModal';

function HomePage() {
  const scale = useCanvasScale();
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  const handleBookTable = () => {
    setIsReservationOpen(true);
  };

  const handleDishClick = (dish) => {
    setSelectedDish(dish);
  };

  return (
    <div className="page-wrap" style={{ '--canvas-scale': scale }}>
      <FixedHeader onBookTable={handleBookTable} />
      <div className="canvas-stage">
        <div className="figma-page">
          <Logo className="logo-top" />

          <nav className="top-nav" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`}>
                {link}
              </a>
            ))}
          </nav>
          <Button variant="orange" className="nav-book" onClick={handleBookTable}>
            Book a table
          </Button>

          <span className="ring ring-one" />
          <span className="ring ring-two" />
          <span className="ring ring-three" />
          <Decoration className="hero-leaf-one" src={assets.heroLeafRight} />
          <Decoration className="hero-leaf-two" src={assets.heroLeafLeft} />
          <Decoration className="hero-leaf-three" src={assets.heroLeafLower} />

          {/* Hero Section */}
          <section className="hero-section">
            <h1 className="hero-title">We provide the best food for you</h1>
            <p className="hero-copy">
              Experience chef-led dining, warm hospitality, and beautifully plated
              dishes made with fresh seasonal ingredients.
            </p>
            <div className="hero-actions">
              <Button className="hero-menu">Menu</Button>
              <Button variant="orange" className="hero-book" onClick={handleBookTable}>
                Book a table
              </Button>
            </div>
            <Socials className="hero-socials" />
            <span className="hero-line" />

            <img className="hero-photo" src={assets.heroRestaurant} alt="Warm restaurant interior" />
            <img className="hero-dish" src={assets.mainDish} alt="Signature plated dish" />
          </section>

          {/* Menu / Special Dishes Section */}
          <section className="special-section" aria-label="Our special dishes">
            <div id="menu" className="scroll-anchor anchor-menu" />
            <div className="special-bg">
              <Decoration className="special-leaf-one" src={assets.specialLeafLeft} />
              <Decoration className="special-leaf-two" src={assets.specialLeafRight} />
              <Decoration className="special-leaf-three" src={assets.specialLeafLower} />
            </div>
            <div className="special-header">
              <h2 className="special-title">Our Special Dishes</h2>
              <p className="special-copy">
                Signature plates prepared daily with bold flavors, fresh produce, and elegant presentation.
              </p>
            </div>
            <div className="dishes-grid">
              {dishes.map((dish) => (
                <DishCard key={dish.id || dish.name} dish={dish} onClick={() => handleDishClick(dish)} />
              ))}
            </div>
          </section>

          {/* Welcome Section */}
          <section className="welcome-section">
            <div id="about" className="scroll-anchor anchor-about" />
            <img className="welcome-dish" src={assets.mainDish} alt="Fresh noodle dish" />
            <Decoration className="welcome-leaf-one" src={assets.specialLeafLeft} />
            <Decoration className="welcome-leaf-two" src={assets.welcomeLeafRight} />
            <div className="welcome-content">
              <h2 className="welcome-title">Welcome to Our Restaurant</h2>
              <p className="welcome-copy">
                Settle into a relaxed dining room where thoughtful service, seasonal
                cooking, and memorable flavors come together.
              </p>
              <div className="welcome-actions">
                <Button className="welcome-menu">Menu</Button>
                <Button variant="orange" className="welcome-book" onClick={handleBookTable}>
                  Book a table
                </Button>
              </div>
            </div>
          </section>

          {/* Chef Section */}
          <section className="chef-section">
            <div id="chef" className="scroll-anchor anchor-chef" />
            <Decoration className="chef-leaf" src={assets.chefLeaf} />
            <span className="chef-glow" />
            <span className="chef-orange" />
            <img className="chef-img" src={assets.chef} alt="Chef holding a plate" />
            <div className="chef-content">
              <h2 className="chef-title">Meet Our Executive Chef</h2>
              <p className="chef-copy">
                Our chefs bring precision, creativity, and a deep respect for fresh
                ingredients to every dish on the menu.
              </p>
              <div className="chef-highlights" aria-label="Chef highlights">
                <span>Michelin-trained team</span>
                <span>Seasonal tasting menus</span>
              </div>
              <div className="chef-note">
                <strong>14+</strong>
                <span>Years crafting modern fine-dining experiences.</span>
              </div>
              <div className="chef-actions">
                <Button className="chef-menu">Menu</Button>
                <Button variant="orange" className="chef-book" onClick={handleBookTable}>
                  Book a table
                </Button>
              </div>
            </div>
          </section>

          {/* Testimonials / Customers Section */}
          <section className="customer-section" aria-label="Customer testimonials">
            <div id="reviews" className="scroll-anchor anchor-reviews" />
            <div className="customer-bg" />
            <Decoration className="customer-pan" src={assets.customerPan} />
            <h2 className="customer-title">Our Happy Customers</h2>
            <p className="customer-copy">
              Guests return for the warm service, refined plates, and a dining experience worth sharing.
            </p>
            <TestimonialSlider />
          </section>

          <section className="newsletter" aria-label="Newsletter">
            <img src={assets.cta} alt="" />
            <div className="newsletter-shade" />
            <h2>Get Our Promo Code by Subscribing To our Newsletter</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" aria-label="Email address" />
              <button type="submit">Subscribe</button>
            </form>
          </section>

          <Footer />
        </div>
      </div>

      {/* Modals rendered outside scaled figma-page canvas */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
      />
      <DishDetailModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<HomePage />);

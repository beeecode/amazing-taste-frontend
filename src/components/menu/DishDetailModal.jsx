import React, { useState } from 'react';
import { X } from 'lucide-react';

const EXTRAS = [
  'Extra Sauce',
  'Side Salad',
  'Garlic Bread',
  'Extra Portion',
  'No Onions',
  'Gluten-Free',
];

export function DishDetailModal({ dish, onClose }) {
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!dish) return null;

  const toggleExtra = (extra) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  };

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const formattedPrice = dish.price
    ? `₦${(dish.price / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`
    : '₦12k';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dish-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Hero image area */}
        <div className="dish-modal-hero">
          <img src={dish.image} alt={dish.name} />
          <div className="dish-modal-badge">{formattedPrice}</div>
        </div>

        {/* Body */}
        <div className="dish-modal-body">
          <h2>{dish.name}</h2>
          <p className="dish-modal-desc">{dish.description}</p>

          {/* Ingredients & Allergens */}
          {(dish.ingredients || dish.allergens) && (
            <div className="dish-info-grid">
              {dish.ingredients && (
                <div className="dish-info-card">
                  <h4>Ingredients</h4>
                  <ul>
                    {dish.ingredients.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dish.allergens && (
                <div className="dish-info-card">
                  <h4>Allergens</h4>
                  <ul className="allergen-tags">
                    {dish.allergens.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Extras */}
          <div className="dish-extras">
            <h4>Add Extras</h4>
            <div className="extras-list">
              {EXTRAS.map((extra) => (
                <button
                  key={extra}
                  type="button"
                  className={`extra-chip ${selectedExtras.includes(extra) ? 'selected' : ''}`}
                  onClick={() => toggleExtra(extra)}
                >
                  {extra}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Order */}
          <div className="dish-order-row">
            <div className="quantity-control" aria-label="Select quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="add-to-order-btn"
              onClick={handleAdd}
              disabled={added}
            >
              {added ? '✓ Added to Order' : `Add ${quantity > 1 ? `× ${quantity}` : ''} to Order`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DishDetailModal;

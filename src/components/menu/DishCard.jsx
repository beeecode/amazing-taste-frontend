import React from 'react';

export function DishCard({ dish, onClick }) {
  const formattedPrice = dish.price 
    ? `₦${(dish.price / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`
    : '₦12k';

  return (
    <article 
      className="food-card" 
      style={{ left: dish.x, top: dish.y, cursor: 'pointer' }}
      onClick={onClick}
    >
      <img src={dish.image} alt={dish.name} />
      <span className="price">{formattedPrice}</span>
      <h3>{dish.name}</h3>
      <p>{dish.description}</p>
    </article>
  );
}

export default DishCard;

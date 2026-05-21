import React from 'react';

export function Button({ children, variant = 'dark', className = '', onClick, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;

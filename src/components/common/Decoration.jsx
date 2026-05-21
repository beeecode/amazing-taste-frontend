import React from 'react';

export function Decoration({ className = '', src }) {
  return <img className={`decoration ${className}`} src={src} alt="" aria-hidden="true" />;
}

export default Decoration;

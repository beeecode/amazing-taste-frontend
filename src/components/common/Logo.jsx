import React from 'react';
import { assets } from '../../constants/assets';

export function Logo({ className = '' }) {
  return (
    <a className={`logo ${className}`} href="#">
      <img src={assets.logo} alt="restaurant" />
    </a>
  );
}
export default Logo;

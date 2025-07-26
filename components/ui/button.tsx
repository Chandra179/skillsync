import React from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', ...props }) => {
  let className = 'rounded font-semibold transition-colors ';
  
  // Size styles
  switch (size) {
    case 'sm':
      className += 'px-2 py-1 text-sm ';
      break;
    case 'lg':
      className += 'px-6 py-3 text-lg ';
      break;
    default:
      className += 'px-4 py-2 ';
  }
  
  // Variant styles
  switch (variant) {
    case 'secondary':
      className += 'bg-gray-200 text-gray-800 hover:bg-gray-300';
      break;
    case 'outline':
      className += 'border border-gray-400 text-gray-800 bg-transparent hover:bg-gray-100';
      break;
    case 'ghost':
      className += 'bg-transparent text-gray-700 hover:bg-gray-100';
      break;
    default:
      className += 'bg-blue-600 text-white hover:bg-blue-700';
  }
  
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};

export default Button;


import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '', onClick, hoverEffect = true }) => {
  return (
    <div
      className={`bg-white shadow-lg rounded-lg overflow-hidden p-6 ${hoverEffect ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {title && <h3 className={`text-xl font-semibold text-sky-600 mb-2 ${onClick && 'group-hover:text-sky-500'}`}>{title}</h3>}
      {subtitle && <p className="text-sm text-slate-500 mb-3">{subtitle}</p>}
      <div className="text-slate-700">
        {children}
      </div>
    </div>
  );
};

export default Card;
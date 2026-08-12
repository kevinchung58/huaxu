import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  onClick,
  hoverEffect = true,
}) => {
  return (
    <div
      className={`${hoverEffect ? 'surface-card-hover' : 'surface-card'} p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {title && <h3 className="mb-1 font-serif text-xl font-semibold text-primary">{title}</h3>}
      {subtitle && <p className="mb-3 text-sm text-muted-fg">{subtitle}</p>}
      <div className="text-secondary">{children}</div>
    </div>
  );
};

export default Card;

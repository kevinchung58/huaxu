import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon }) => (
  <div className="surface-card bg-gold-tint/60 px-6 py-12 text-center">
    {icon && (
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
    )}
    <h3 className="font-serif text-xl font-semibold text-primary">{title}</h3>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-fg">{description}</p>
  </div>
);

export default EmptyState;

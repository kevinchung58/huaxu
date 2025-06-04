
import React from 'react';

interface SectionProps {
  title: string;
  subtitle?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

const Section: React.FC<SectionProps> = ({ title, subtitle, id, children, className = '', titleClassName = '', contentClassName = '' }) => {
  return (
    <section id={id} className={`py-12 md:py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-4 text-sky-600 ${titleClassName}`}>
          {title}
        </h2>
        {subtitle && <p className="text-center text-slate-600 text-lg mb-8 md:mb-12">{subtitle}</p>}
        <div className={contentClassName}>
          {children}
        </div>
      </div>
    </section>
  );
};

export default Section;
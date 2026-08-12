import React from 'react';

interface SectionProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  align?: 'left' | 'center';
}

const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  eyebrow,
  id,
  children,
  className = '',
  titleClassName = '',
  contentClassName = '',
  align = 'left',
}) => {
  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <section id={id} className={`py-14 md:py-20 ${className}`}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className={`mb-10 md:mb-12 ${alignClass}`}>
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">{eyebrow}</p>
          )}
          <h2 className={`font-sans text-3xl font-semibold tracking-tight text-primary sm:text-4xl ${titleClassName}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-3 max-w-2xl text-lg text-muted-fg ${align === 'center' ? 'mx-auto' : ''}`}>{subtitle}</p>
          )}
        </div>
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
};

export default Section;

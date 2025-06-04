
import React from 'react';

const AcademicCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path d="M3.75 13.5l3.75-1.5L12 15l8.25-3L12 6.75 3.75 9v4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.375L12 12.375l8.25-3M3.75 13.5V18a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0020.25 18v-4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.375V21.75m0 0A2.25 2.25 0 0014.25 19.5H12m0 2.25A2.25 2.25 0 019.75 19.5H12M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
export default AcademicCapIcon;

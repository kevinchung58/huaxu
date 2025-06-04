
import React from 'react';

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-3.422-.983l-2.473-1.417M12 14.25a5.25 5.25 0 00-5.25 5.25V18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 5.25a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V5.25z" />
  </svg>
);
export default UsersIcon;

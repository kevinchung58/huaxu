
import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';

const NotFoundPage: React.FC = () => {
  return (
    <Section title="404 - Page Not Found" className="text-center bg-white">
      <p className="text-lg text-slate-600 mb-8">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
      >
        Go Back to Home
      </Link>
    </Section>
  );
};

export default NotFoundPage;
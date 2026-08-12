import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';

const NotFoundPage: React.FC = () => {
  return (
    <Section title="Page not found" eyebrow="404" align="center" className="bg-background">
      <p className="mb-8 text-lg text-muted-fg">This address does not match a page on the site.</p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </Section>
  );
};

export default NotFoundPage;

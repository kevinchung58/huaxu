import React from 'react';
import { Link } from 'react-router-dom';
import { SITE, SOCIAL_LINKS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-primary/20 bg-primary text-slate-300">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
        <div className="text-center md:text-left">
          <p className="font-serif text-lg text-white">
            {SITE.name} <span className="text-sm text-slate-400">{SITE.honorific}</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">{SITE.role}</p>
        </div>
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="cursor-pointer text-slate-300 transition-colors duration-200 hover:text-white"
            >
              <link.icon className="h-5 w-5" />
            </a>
          ))}
          <Link to="/research" className="cursor-pointer text-sm text-slate-300 underline-offset-4 hover:text-white hover:underline">
            Research
          </Link>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

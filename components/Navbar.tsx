
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAVIGATION_LINKS } from '../constants';
import { NavLinkItem } from '../types';
import { MenuIcon, XIcon } from './icons';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path: string) => {
    // For HashRouter, location.pathname is usually '/', and location.hash contains the route
    const currentPath = location.hash === '' || location.hash === '#/' ? '/' : location.hash.substring(1);
    if (path === '/' && currentPath === '/') return true;
    return currentPath === path;
  };
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navBackgroundClass = isScrolled || isOpen ? 'bg-slate-800/95 backdrop-blur-md shadow-lg' : 'bg-slate-900/60 backdrop-blur-sm';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${navBackgroundClass}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 flex items-center mr-12"> {/* Increased margin here */}
            {/* Logo can go here if needed */}
            <span className="text-lg md:text-xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
              Hua-Xu Zhong, PhD
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-1">
            {NAVIGATION_LINKS.map((item: NavLinkItem) => (
              <Link
                key={item.label}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                           ${isActive(item.path)
                             ? 'bg-sky-600 text-white shadow-sm'
                             : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                           }`}
                onClick={() => setIsOpen(false)} // Close mobile menu on desktop nav click (good practice)
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isOpen && (
        <div className="md:hidden bg-slate-800/95 backdrop-blur-md" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAVIGATION_LINKS.map((item: NavLinkItem) => (
              <Link
                key={item.label}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors
                           ${isActive(item.path)
                             ? 'bg-sky-600 text-white shadow-sm'
                             : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                           }`}
                onClick={() => setIsOpen(false)} // Close menu on mobile link click
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

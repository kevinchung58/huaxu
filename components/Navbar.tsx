import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAVIGATION_LINKS, SITE } from '../constants';
import { NavLinkItem } from '../types';
import { ChevronDownIcon, MenuIcon, XIcon } from './icons';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
    isActive
      ? 'bg-primary text-on-primary shadow-sm'
      : 'text-slate-200 hover:bg-white/10 hover:text-white'
  }`;

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const moreItem = NAVIGATION_LINKS.find((item) => item.children?.length);
  const moreActive = moreItem?.children?.some((child) => child.path === location.pathname) ?? false;

  return (
    <nav
      className={`fixed z-50 w-full transition-all duration-300 ${
        isScrolled || isOpen
          ? 'bg-primary/95 shadow-lg backdrop-blur-md'
          : 'bg-primary/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-[4.25rem] items-center justify-between">
          <Link to="/" className="group flex min-w-0 flex-col leading-tight">
            <span className="truncate font-serif text-lg font-semibold text-white transition-colors group-hover:text-gold-tint sm:text-xl">
              {SITE.name}
            </span>
            <span className="text-[11px] font-medium tracking-wide text-slate-300">{SITE.honorific}</span>
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex">
            {NAVIGATION_LINKS.map((item: NavLinkItem) => {
              if (item.children?.length) {
                return (
                  <div key={item.label} className="relative" ref={moreRef}>
                    <button
                      type="button"
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        moreActive
                          ? 'bg-primary-soft text-white'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                      aria-expanded={moreOpen}
                      aria-haspopup="menu"
                      onClick={() => setMoreOpen((open) => !open)}
                    >
                      {item.label}
                      <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {moreOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-primary py-1 shadow-[var(--shadow-lg)]"
                      >
                        {item.children.map((child) => (
                          <NavLink
                            key={child.label}
                            to={child.path ?? '/'}
                            role="menuitem"
                            className={({ isActive }) =>
                              `block px-4 py-2.5 text-sm transition-colors duration-200 ${
                                isActive ? 'bg-accent text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink key={item.label} to={item.path ?? '/'} end={item.path === '/'} className={linkClass}>
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex cursor-pointer items-center justify-center rounded-md p-2 text-slate-200 hover:bg-white/10 hover:text-white lg:hidden"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Toggle main menu</span>
            {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-primary/98 lg:hidden" id="mobile-menu">
          <div className="space-y-1 px-3 py-3">
            {NAVIGATION_LINKS.flatMap((item) =>
              item.children?.length
                ? [
                    <p key={`${item.label}-label`} className="px-3 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {item.label}
                    </p>,
                    ...item.children.map((child) => (
                      <NavLink
                        key={child.label}
                        to={child.path ?? '/'}
                        className={({ isActive }) =>
                          `block rounded-md px-3 py-2 text-base font-medium ${
                            isActive ? 'bg-accent text-white' : 'text-slate-200 hover:bg-white/10'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    )),
                  ]
                : [
                    <NavLink
                      key={item.label}
                      to={item.path ?? '/'}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-2 text-base font-medium ${
                          isActive ? 'bg-accent text-white' : 'text-slate-200 hover:bg-white/10'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>,
                  ]
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

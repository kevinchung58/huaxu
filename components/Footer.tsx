
import React from 'react';
// SOCIAL_LINKS import removed as it's no longer used
// SocialLink type import removed as it's no longer used

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 text-slate-400 py-8">
      <div className="container mx-auto px-4 text-center">
        {/* Social media links div removed */}
        <p className="text-sm text-slate-300">
          &copy; {new Date().getFullYear()} Hua-Xu Zhong. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
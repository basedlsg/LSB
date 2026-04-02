import React from 'react';

const Footer = ({ className = "" }: { className?: string }) => (
  <footer className={`relative z-10 py-12 px-6 text-center ${className}`}>
    <div className="text-[9px] tracking-[0.4em] uppercase space-y-2" style={{ color: '#6B5B4B' }}>
      <div>Walking Stick Labs · San Francisco</div>
      <div>&copy; Walking Stick Labs</div>
    </div>
  </footer>
);

export default Footer;

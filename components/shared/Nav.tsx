import React from 'react';

const Nav = ({ showBack = true }: { showBack?: boolean }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-8 md:px-12 pointer-events-none">
      <div className="flex justify-between items-center text-white/50 font-mono text-[10px] tracking-[0.4em] uppercase">
        <div className="pointer-events-auto">
          {showBack ? (
            <a href="#/" className="hover:text-white transition-colors duration-500 flex items-center gap-4 group">
              <span className="inline-block transition-transform duration-500 group-hover:-translate-x-2">&larr;</span>
              BACK
            </a>
          ) : (
            <a href="#/" className="hover:text-white transition-colors duration-500">
              WALKING STICK LABS
            </a>
          )}
        </div>

        <div className="flex gap-8 md:gap-12 pointer-events-auto">
          <a href="#/projects" className="hover:text-white transition-colors duration-500">RESEARCH</a>
          <a href="#/notes" className="hover:text-white transition-colors duration-500">NOTES</a>
          <a href="#/philosophy" className="hover:text-white transition-colors duration-500">PHILOSOPHY</a>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

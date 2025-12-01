import React, { useEffect, useRef } from 'react';

interface CursorProps {
  dim?: boolean;
}

const Cursor: React.FC<CursorProps> = ({ dim = false }) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

      // Subtle trail - less frequent when dimmed
      if (Math.random() > (dim ? 0.85 : 0.6)) {
        const trail = document.createElement('div');
        trail.className = 'fixed w-0.5 h-0.5 bg-white rounded-full pointer-events-none z-50';
        trail.style.left = `${e.clientX}px`;
        trail.style.top = `${e.clientY}px`;
        trail.style.opacity = dim ? '0.2' : '0.4';
        trail.style.transform = 'translate(-50%, -50%)';
        trail.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';

        document.body.appendChild(trail);

        requestAnimationFrame(() => {
          trail.style.transform = 'translate(-50%, -50%) scale(2)';
          trail.style.opacity = '0';
        });

        setTimeout(() => {
          if (document.body.contains(trail)) {
            document.body.removeChild(trail);
          }
        }, 500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [dim]);

  const cursorStyle = dim ? `
    body { cursor: none !important; }
    .cursor-main {
       pointer-events: none;
       position: fixed;
       top: 0;
       left: 0;
       width: 5px;
       height: 5px;
       background-color: rgba(253, 251, 247, 0.5);
       border-radius: 50%;
       z-index: 9999;
       margin-left: -2.5px;
       margin-top: -2.5px;
       mix-blend-mode: normal;
       transition: transform 0.05s linear;
       box-shadow: 0 0 8px rgba(253, 251, 247, 0.3);
    }
  ` : `
    body { cursor: none !important; }
    .cursor-main {
       pointer-events: none;
       position: fixed;
       top: 0;
       left: 0;
       width: 6px;
       height: 6px;
       background-color: #FDFBF7;
       border-radius: 50%;
       z-index: 9999;
       margin-left: -3px;
       margin-top: -3px;
       mix-blend-mode: exclusion;
       transition: transform 0.05s linear;
    }
  `;

  return (
    <>
      <style>{cursorStyle}</style>
      <div ref={cursorRef} className="cursor-main" />
    </>
  );
};

export default Cursor;
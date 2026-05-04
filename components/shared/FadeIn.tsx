import React, { useState, useEffect } from 'react';

const FadeIn = ({ 
  children, 
  delay = 0, 
  className = "", 
  isVisible: manualVisible 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
  isVisible?: boolean;
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (manualVisible !== undefined) {
      if (manualVisible) {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
      } else {
        setVisible(false);
      }
    } else {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay, manualVisible]);

  return (
    <div className={`transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  );
};

export default FadeIn;

import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoLogoutBannerProps {
  onDismiss?: () => void;
}

export const DemoLogoutBanner: React.FC<DemoLogoutBannerProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!isVisible && !isLeaving) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-[9999]',
        'max-w-2xl w-full mx-auto px-4',
        'transition-all duration-300 ease-out',
        isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="h-5 w-5" aria-hidden="true" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base mb-1">
            📊 Demo Mode Active
          </h3>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            We would've logged you out if this weren't a portfolio demo! 
            All data is mock and for demonstration purposes only.
          </p>
          <p className="text-xs text-white/75 mt-1">
            Contact: <a href="mailto:amit.yogev@gmail.com" className="underline hover:text-white">amit.yogev@gmail.com</a>
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DemoLogoutBanner;


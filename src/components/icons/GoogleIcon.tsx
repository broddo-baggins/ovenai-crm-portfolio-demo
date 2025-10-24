import React from 'react';

interface GoogleIconProps {
  className?: string;
}

export const GoogleIcon: React.FC<GoogleIconProps> = ({ className }) => {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="18" 
      height="18" 
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      {/* Official Google "G" logo with correct colors */}
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-2.7.75c-2.09 0-3.87-1.4-4.5-3.32H1.83v2.07A7.98 7.98 0 0 0 8.98 17Z"
      />
      <path
        fill="#FBBC05"
        d="M4.48 10.45a4.77 4.77 0 0 1 0-2.9V5.48H1.83a7.98 7.98 0 0 0 0 7.04l2.65-2.07Z"
      />
      <path
        fill="#EA4335"
        d="M8.98 3.77c1.18 0 2.23.4 3.06 1.2l2.3-2.3A7.95 7.95 0 0 0 8.98 1a7.98 7.98 0 0 0-7.15 4.48l2.65 2.07c.63-1.92 2.41-3.32 4.5-3.32Z"
      />
    </svg>
  );
};

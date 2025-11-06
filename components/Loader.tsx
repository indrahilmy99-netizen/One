
import React from 'react';

interface LoaderProps {
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ className = 'w-12 h-12' }) => {
  return (
    <div className="flex justify-center items-center">
      <svg
        className={`animate-spin text-amber-700 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 21a9 9 0 1 0-9-9"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16.5 14.5c-.3-1.8-1.3-3.4-2.8-4.4a4.5 4.5 0 1 0-4.4 7.2"
        />
      </svg>
    </div>
  );
};

export default Loader;

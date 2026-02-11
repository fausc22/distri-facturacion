import React from 'react';

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-[3px]'
};

export default function LoadingSpinner({
  size = 'md',
  className = '',
  colorClass = 'border-current'
}) {
  const spinnerSize = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={`inline-block animate-spin rounded-full ${spinnerSize} ${colorClass} border-solid border-t-transparent ${className}`}
      aria-hidden="true"
    />
  );
}


import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function LoadingButton({
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  loadingText = 'Procesando...',
  children,
  spinnerSize = 'sm'
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${className} transition-transform active:scale-[0.98]`}
      aria-busy={loading}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <LoadingSpinner size={spinnerSize} colorClass="border-white" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}


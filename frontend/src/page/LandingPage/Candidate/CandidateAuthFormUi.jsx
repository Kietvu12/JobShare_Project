import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export const AUTH_FONT = '"Myriad Pro", sans-serif';

export const authLabelClass = 'block text-sm font-medium text-gray-900 mb-2';

export const authInputClass =
  'w-full py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-gray-900 placeholder-gray-400';

export function authInputWithIcons({ leftIcon = true, rightIcon = false } = {}) {
  let cls = authInputClass;
  if (leftIcon) cls += ' pl-12';
  else cls += ' pl-4';
  if (rightIcon) cls += ' pr-12';
  else cls += ' pr-4';
  return cls;
}

export function AuthErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AuthSubmitButton({ loading, disabled, children, loadingText }) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full py-3.5 rounded-lg transition-all duration-200 font-semibold shadow-md ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={{
        fontFamily: AUTH_FONT,
        backgroundColor: hovered && !isDisabled ? '#b91c1c' : '#dc2626',
        color: 'white',
        boxShadow:
          hovered && !isDisabled
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transform: hovered && !isDisabled ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{loadingText || '…'}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthPrimaryButton({ onClick, children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full py-3.5 rounded-lg font-semibold shadow-md transition-all duration-200"
      style={{
        fontFamily: AUTH_FONT,
        backgroundColor: hovered ? '#b91c1c' : '#dc2626',
        color: 'white',
      }}
    >
      {children}
    </button>
  );
}

export function AuthPasswordToggle({ show, onToggle, inputId }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
      style={{ color: hovered ? '#b91c1c' : '#6b7280' }}
      aria-label={show ? 'Hide password' : 'Show password'}
      aria-controls={inputId}
    >
      {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );
}

export function AuthTextLink({ children, className = '', ...props }) {
  return (
    <a
      className={`text-black hover:text-red-700 text-sm transition-colors underline ${className}`}
      style={{ fontFamily: AUTH_FONT }}
      {...props}
    >
      {children}
    </a>
  );
}

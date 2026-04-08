import React from 'react';

/**
 * A standard, reusable Button component.
 * @param {string} variant - primary | secondary | ghost
 * @param {string} size - default | sm
 * @param {boolean} disabled - disabled state
 * @param {string} className - extra classes
 * @param {object} style - extra inline styles
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  let baseClass = 'btn';
  if (variant === 'primary') baseClass += ' btn-primary';
  if (variant === 'secondary') baseClass += ' btn-secondary';
  if (variant === 'ghost') baseClass += ' btn-ghost';
  
  if (size === 'sm') baseClass += ' btn-sm';
  
  const finalClass = `${baseClass} ${className}`.trim();

  return (
    <button className={finalClass} disabled={disabled} style={style} {...props}>
      {children}
    </button>
  );
}

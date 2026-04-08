import React from 'react';

/**
 * A standard Badge component.
 * @param {string} variant - cyan | green | purple | amber
 * @param {string} className
 */
export default function Badge({
  children,
  variant = 'cyan',
  className = '',
  style = {},
  ...props
}) {
  const finalClass = `badge badge-${variant} ${className}`.trim();
  
  return (
    <span className={finalClass} style={style} {...props}>
      {children}
    </span>
  );
}

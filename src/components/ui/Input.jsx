import React from 'react';

/**
 * A standard Input component.
 * @param {boolean} multiline - whether to render a textarea
 * @param {string} className
 */
export default function Input({
  multiline = false,
  className = '',
  style = {},
  ...props
}) {
  const finalClass = `inp ${className}`.trim();
  
  if (multiline) {
    return <textarea className={finalClass} style={style} {...props} />;
  }
  
  return <input className={finalClass} style={style} {...props} />;
}

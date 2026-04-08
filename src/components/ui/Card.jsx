import React from 'react';

/**
 * A standard, reusable Card component with glassmorphism support.
 * @param {boolean} glow - whether the card should emit a subtle cyan glow
 * @param {boolean} animated - whether to animate in
 * @param {boolean} hoverEffect - whether it scales slightly on hover
 * @param {boolean} sm - small padding variant
 * @param {string} className
 */
export default function Card({
  children,
  glow = false,
  glowColor = 'var(--cyan)',
  animated = false,
  hoverEffect = false,
  sm = false,
  className = '',
  style = {},
  ...props
}) {
  let baseClass = sm ? 'card card-sm' : 'card';
  if (glow) baseClass += ' anim-border';
  
  const customStyle = { ...style };
  if (glow) customStyle['--glow-color'] = glowColor;
  
  const finalClass = `${baseClass} ${className}`.trim();
  
  return (
    <div 
      className={finalClass} 
      style={customStyle} 
      onMouseEnter={hoverEffect ? (e) => (e.currentTarget.style.transform = 'translateY(-3px)') : undefined}
      onMouseLeave={hoverEffect ? (e) => (e.currentTarget.style.transform = '') : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

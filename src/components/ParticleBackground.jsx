import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const colors = ['#22d3ee', '#3b82f6', '#c084fc', '#e879f9', '#f472b6']; // Theme colors
    const particleCount = Math.floor((w * h) / 15000); // Responsive particle count

    for (let i = 0; i < particleCount; i++) {
       particles.push({
         x: Math.random() * w,
         y: Math.random() * h,
         vx: (Math.random() - 0.5) * 0.8,
         vy: (Math.random() - 0.5) * 0.8,
         radius: Math.random() * 2 + 1,
         color: colors[Math.floor(Math.random() * colors.length)],
         baseAlpha: Math.random() * 0.5 + 0.2
       });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      
      const theme = document.documentElement.getAttribute('data-theme');
      const isDark = theme === 'dark' || !theme;
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        // Make particles slightly more transparent in light mode
        ctx.globalAlpha = isDark ? p.baseAlpha : p.baseAlpha * 0.7;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around smoothly
        if (p.x < -50) p.x = w + 50;
        if (p.x > w + 50) p.x = -50;
        if (p.y < -50) p.y = h + 50;
        if (p.y > h + 50) p.y = -50;
      }
      
      ctx.globalAlpha = 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
           const p1 = particles[i];
           const p2 = particles[j];
           const dx = p1.x - p2.x;
           const dy = p1.y - p2.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           if (dist < 130) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              
              const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
              gradient.addColorStop(0, p1.color);
              gradient.addColorStop(1, p2.color);
              
              ctx.strokeStyle = gradient;
              const lineAlpha = ((130 - dist) / 130) * (isDark ? 0.3 : 0.15);
              ctx.globalAlpha = lineAlpha;
              ctx.lineWidth = 1;
              ctx.stroke();
           }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default ParticleBackground;

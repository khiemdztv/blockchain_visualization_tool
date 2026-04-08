import React, { useEffect, useRef } from 'react';

export default function BlockchainCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrame;
    let W, H;
    // Blockchain nodes
    const NODES = 18;
    const nodes = [];
    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      // Re-init nodes on resize
      nodes.length = 0;
      for (let i = 0; i < NODES; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 3 + Math.random() * 4,
          hue: Math.random() > 0.5 ? 190 : 220,
          alpha: 0.4 + Math.random() * 0.5,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Flowing hash text particles
    const hashChars = '0123456789abcdef';
    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * (typeof W !== 'undefined' ? W : 800),
      y: Math.random() * (typeof H !== 'undefined' ? H : 400),
      char: hashChars[Math.floor(Math.random() * hashChars.length)],
      speed: 0.3 + Math.random() * 0.5,
      alpha: 0.06 + Math.random() * 0.12,
      size: 10 + Math.random() * 8,
      changeTimer: Math.floor(Math.random() * 80),
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.012;

      // Draw falling hex characters
      particles.forEach(p => {
        p.y += p.speed;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        p.changeTimer--;
        if (p.changeTimer <= 0) {
          p.char = hashChars[Math.floor(Math.random() * hashChars.length)];
          p.changeTimer = 40 + Math.floor(Math.random() * 60);
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `hsl(190, 90%, 65%)`;
        ctx.font = `${p.size}px JetBrains Mono, monospace`;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      });

      // Move nodes
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.pulse += 0.04;
      });

      // Draw edges (block links)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.18;
            const hue = (i + j) % 2 === 0 ? 190 : 220;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = `hsl(${hue}, 90%, 65%)`;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 8]);
            ctx.lineDashOffset = -t * 8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }
        }
      }

      // Draw nodes (glowing dots)
      nodes.forEach((n, i) => {
        const pulseFactor = 0.5 + 0.5 * Math.sin(n.pulse);
        const glowR = n.r * (1.5 + pulseFactor * 1.2);
        // Glow
        ctx.save();
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR * 3);
        grad.addColorStop(0, `hsla(${n.hue}, 90%, 65%, ${n.alpha * 0.6})`);
        grad.addColorStop(1, `hsla(${n.hue}, 90%, 65%, 0)`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR * 3, 0, Math.PI * 2);
        ctx.fill();
        // Core dot
        ctx.globalAlpha = n.alpha;
        ctx.fillStyle = `hsl(${n.hue}, 90%, 72%)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + pulseFactor, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Tiny block squares for some nodes
        if (i % 4 === 0) {
          ctx.save();
          ctx.globalAlpha = 0.12;
          ctx.strokeStyle = `hsl(${n.hue}, 80%, 65%)`;
          ctx.lineWidth = 1;
          const s = 18 + pulseFactor * 6;
          ctx.strokeRect(n.x - s/2, n.y - s/2, s, s);
          ctx.restore();
        }
      });

      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}
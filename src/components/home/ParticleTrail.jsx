import React, { useEffect, useRef } from 'react';

export default function ParticleTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const particles = [];
    const mouse = { x: W / 2, y: H / 2 };

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    const onMove = (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 10,
          y: mouse.y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.3,
          life: 1,
          decay: 0.022 + Math.random() * 0.018,
          size: 1.5 + Math.random() * 3,
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);

    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy -= 0.012; p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.life * 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(193 + 47 * (1 - p.life))},7,1)`;
        ctx.shadowBlur = 10; ctx.shadowColor = '#FFC107';
        ctx.fill(); ctx.restore();
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 99998,
    }} />
  );
}
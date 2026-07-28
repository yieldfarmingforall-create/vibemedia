import React, { useEffect, useRef } from 'react';

// Dot grid that glows amber near the cursor
export default function InteractiveGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SPACING = 52, DOT_R = 1.1, RADIUS = 160;
    let W, H, cols, rows;
    const mouse = { x: -999, y: -999 };

    const setup = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
      cols = Math.ceil(W / SPACING) + 1;
      rows = Math.ceil(H / SPACING) + 1;
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY - canvas.getBoundingClientRect().top; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', setup);
    setup();

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING, y = r * SPACING;
          const dist = Math.sqrt((x - mouse.x) ** 2 + (y - mouse.y) ** 2);
          const inf = Math.max(0, 1 - dist / RADIUS);
          ctx.beginPath();
          ctx.arc(x, y, DOT_R + inf * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = inf > 0.05 ? `rgba(255,193,7,${0.07 + inf * 0.5})` : 'rgba(255,255,255,0.055)';
          ctx.shadowBlur = inf > 0.25 ? 8 * inf : 0;
          ctx.shadowColor = '#FFC107';
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', setup);
    };
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  );
}
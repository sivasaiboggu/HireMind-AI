import React, { useEffect, useRef } from 'react';

export const WebGLBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Sparse anchor dots
    const numAnchors = 28;
    const anchors: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    for (let i = 0; i < numAnchors; i++) {
      anchors.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.6 ? '#FF6A55' : '#8B5CF6'
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX;
      mouseRef.current.ty = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Initialize mouse positions
    mouseRef.current.x = window.innerWidth / 2;
    mouseRef.current.y = window.innerHeight / 2;
    mouseRef.current.tx = window.innerWidth / 2;
    mouseRef.current.ty = window.innerHeight / 2;

    let pulseTime = 0;

    const render = () => {
      ctx.fillStyle = '#09090E';
      ctx.fillRect(0, 0, width, height);

      // Smooth pointer parallax drift
      const mouse = mouseRef.current;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // Draw subtle shader gradient glow behind elements
      const radialGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        Math.max(width, height) * 0.6
      );
      radialGlow.addColorStop(0, 'rgba(139, 92, 246, 0.05)'); // Violet core
      radialGlow.addColorStop(0.4, 'rgba(255, 106, 85, 0.025)'); // Coral glow edge
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Animate breathing pulse
      pulseTime += 0.008;
      const breathe = Math.sin(pulseTime) * 0.15 + 0.85;

      // Draw perspective grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 0.8;

      const horizonY = height * 0.45;
      const numLines = 24;
      for (let i = 0; i < numLines; i++) {
        const ratio = i / numLines;
        const gridY = horizonY + (height - horizonY) * Math.pow(ratio, 2.5) * breathe;
        ctx.beginPath();
        ctx.moveTo(0, gridY);
        ctx.lineTo(width, gridY);
        ctx.stroke();
      }

      const horizonX = width / 2 + (mouse.x - width / 2) * -0.05;
      const numVLines = 36;
      for (let i = 0; i <= numVLines; i++) {
        const angleRatio = (i / numVLines) - 0.5;
        const targetX = width / 2 + angleRatio * width * 2.5;
        ctx.beginPath();
        ctx.moveTo(horizonX, horizonY);
        ctx.lineTo(targetX, height);
        ctx.stroke();
      }

      // Draw line lattice and floating anchors
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < anchors.length; i++) {
        const a1 = anchors[i];
        a1.x += a1.vx;
        a1.y += a1.vy;

        if (a1.x < 0 || a1.x > width) a1.vx *= -1;
        if (a1.y < 0 || a1.y > height) a1.vy *= -1;

        const dx = mouse.x - width / 2;
        const dy = mouse.y - height / 2;
        const px = a1.x + dx * 0.015;
        const py = a1.y + dy * 0.015;

        for (let j = i + 1; j < anchors.length; j++) {
          const a2 = anchors[j];
          const pax2 = a2.x + dx * 0.015;
          const pay2 = a2.y + dy * 0.015;
          
          const dist = Math.hypot(px - pax2, py - pay2);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.07;
            ctx.strokeStyle = `rgba(169, 163, 181, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(pax2, pay2);
            ctx.stroke();
          }
        }

        ctx.fillStyle = a1.color;
        ctx.beginPath();
        ctx.arc(px, py, a1.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
};

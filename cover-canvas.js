(() => {
  const canvas = document.getElementById('lab-field');
  if (!canvas || typeof canvas.getContext !== 'function') return;
  let context;
  try { context = canvas.getContext('2d'); } catch { return; }
  if (!context) return;
  let width = 1, height = 1, frame = 0, active = true, phase = 0, lastDraw = 0;
  let pointer = null, pulse = 0, reduced = false;
  const isStatic = () => reduced || window.innerWidth < 768;
  let motionQuery;
  try { motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)'); reduced = !!motionQuery?.matches; } catch { /* Static fallback remains available. */ }
  canvas.dataset.motion = isStatic() ? 'static' : 'animated';
  const particles = Array.from({length: 86}, (_, i) => ({
    angle: i * 2.399963, radius: 0.12 + (i % 21) / 24,
    speed: 0.14 + (i % 7) / 19,
  }));
  function draw() {
    const light = document.documentElement.dataset.theme === 'light';
    const ink = light ? '0,102,116' : '100,222,232';
    context.clearRect(0, 0, width, height);
    const cx = width * 0.5, cy = height * 0.34, radius = Math.min(width * 0.54, height * 0.58);
    const glow = context.createRadialGradient(cx, cy, 1, cx, cy, radius);
    glow.addColorStop(0, `rgba(${ink},${light ? '.22' : '.28'})`); glow.addColorStop(1, `rgba(${ink},0)`);
    context.fillStyle = glow; context.fillRect(0, 0, width, height);
    if (pointer) {
      const pGlow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 90);
      pGlow.addColorStop(0, `rgba(${ink},${light ? '.16' : '.24'})`);
      pGlow.addColorStop(1, `rgba(${ink},0)`);
      context.fillStyle = pGlow;
      context.beginPath(); context.arc(pointer.x, pointer.y, 90, 0, Math.PI * 2); context.fill();
    }
    const points = particles.map(p => {
      const a = p.angle + phase * p.speed;
      const r = radius * p.radius * (1 + pulse * 0.18);
      let x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.7;
      if (pointer) { const dx = pointer.x - x, dy = pointer.y - y, distance = Math.hypot(dx, dy); const force = Math.max(0, 1 - distance / 140) * 0.22; x += dx * force; y += dy * force; }
      return {x, y};
    });
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const q = points[j], distance = Math.hypot(p.x - q.x, p.y - q.y);
        if (distance > 82) continue;
        context.strokeStyle = `rgba(${ink},${(1 - distance / 82) * (light ? 0.36 : 0.44)})`;
        context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y); context.stroke();
      }
      context.fillStyle = `rgba(${ink},${light ? '.85' : '.95'})`; context.beginPath(); context.arc(p.x, p.y, i % 8 === 0 ? 2.4 : 1.15, 0, Math.PI * 2); context.fill();
    }
    if (pulse > 0.04) {
      context.strokeStyle = `rgba(${ink},${pulse * (light ? 0.45 : 0.55)})`;
      context.lineWidth = 1.2;
      context.beginPath(); context.arc(cx, cy, (1 - pulse) * radius * 0.88, 0, Math.PI * 2); context.stroke();
    }
    context.strokeStyle = `rgba(${ink},.65)`; context.lineWidth = 1.4;
    context.beginPath(); context.moveTo(cx, cy - 25); context.lineTo(cx + 9, cy - 9); context.lineTo(cx + 25, cy); context.lineTo(cx + 9, cy + 9); context.lineTo(cx, cy + 25); context.lineTo(cx - 9, cy + 9); context.lineTo(cx - 25, cy); context.lineTo(cx - 9, cy - 9); context.closePath(); context.stroke();
    pulse *= 0.95;
  }
  function tick(time) { frame = 0; if (!active || document.hidden || isStatic()) return; if (time - lastDraw >= 33) { phase += 0.013; draw(); lastDraw = time; } frame = requestAnimationFrame(tick); }
  function schedule() { if (!frame && active && !document.hidden && !isStatic() && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick); }
  function resize() { const rect = canvas.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height); const ratio = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0); canvas.dataset.motion = isStatic() ? 'static' : 'animated'; if (isStatic() && frame) { cancelAnimationFrame(frame); frame = 0; } draw(); schedule(); }
  const surface = canvas.closest('.cover-atlas') || canvas;
  surface.addEventListener('pointermove', event => { if (isStatic()) return; const rect = canvas.getBoundingClientRect(); pointer = {x: event.clientX - rect.left, y: event.clientY - rect.top}; });
  surface.addEventListener('pointerleave', () => { pointer = null; });
  surface.addEventListener('pointerdown', () => { if (!isStatic()) { pulse = 1; draw(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else schedule(); });
  if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => { active = entries[0].isIntersecting; if (!active && frame) { cancelAnimationFrame(frame); frame = 0; } else schedule(); }).observe(canvas);
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  if (typeof MutationObserver === 'function') new MutationObserver(draw).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  motionQuery?.addEventListener?.('change', event => { reduced = event.matches; canvas.dataset.motion = isStatic() ? 'static' : 'animated'; if (isStatic() && frame) { cancelAnimationFrame(frame); frame = 0; } draw(); schedule(); });
  resize();
})();

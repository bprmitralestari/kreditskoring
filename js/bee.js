// ============================================================
// KURSOR LEBAH — lebah kecil terbang mengikuti kursor (hanya perangkat dengan mouse)
// Kursor asli tetap tampil agar tombol mudah diklik.
// ============================================================
(function () {
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bee = document.createElement('div');
  bee.id = 'bee';
  bee.setAttribute('aria-hidden', 'true');
  bee.innerHTML = `
    <svg viewBox="0 0 64 64">
      <g class="wing wl"><ellipse cx="25" cy="18" rx="10" ry="6.5" fill="#E0F2FE" fill-opacity=".9" stroke="#7DD3FC"/></g>
      <g class="wing wr"><ellipse cx="38" cy="18" rx="10" ry="6.5" fill="#E0F2FE" fill-opacity=".9" stroke="#7DD3FC"/></g>
      <ellipse cx="31" cy="36" rx="17" ry="12" fill="#FACC15" stroke="#1F2937" stroke-width="2.5"/>
      <path d="M22 26q-3 10 0 20M31 25q-3 11 0 22M40 26q-3 10 0 20" fill="none" stroke="#1F2937" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="47" cy="32" r="7" fill="#FACC15" stroke="#1F2937" stroke-width="2.5"/>
      <circle cx="49.5" cy="30" r="1.8" fill="#1F2937"/>
      <path d="M14 36L3 33" stroke="#1F2937" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  document.body.appendChild(bee);

  const SIZE = 36;
  const OFFSET_X = -20, OFFSET_Y = -16; // lebah berada sedikit di atas-kiri ujung kursor
  let x = innerWidth / 2, y = innerHeight / 2;
  let tx = x, ty = y, ang = 0, t = 0;

  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

  (function loop() {
    t += 0.12;
    const dx = tx - x, dy = ty - y;
    const dist = Math.hypot(dx, dy);

    // Mengejar kursor dengan sedikit tertinggal
    x += dx * 0.14;
    y += dy * 0.14;

    // Badan menghadap arah gerak (berputar halus)
    if (dist > 1.5) {
      const target = Math.atan2(dy, dx) * 180 / Math.PI;
      let diff = target - ang;
      diff = ((diff + 540) % 360) - 180;
      ang += diff * 0.2;
    }

    // Melayang naik-turun ringan
    const bob = Math.sin(t) * 2.5;
    const flip = Math.abs(ang) > 90 ? -1 : 1;
    bee.style.transform =
      `translate3d(${x + OFFSET_X - SIZE / 2}px, ${y + OFFSET_Y + bob - SIZE / 2}px, 0) ` +
      `rotate(${ang}deg) scale(1, ${flip})`;

    requestAnimationFrame(loop);
  })();
})();

// ============================================================
// KURSOR LEBAH — lebah bergaris kuning-hitam terbang mengikuti kursor (hanya perangkat dengan mouse)
// Kursor asli tetap tampil agar tombol mudah diklik.
// ============================================================
(function () {
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bee = document.createElement('div');
  bee.id = 'bee';
  bee.setAttribute('aria-hidden', 'true');
  bee.innerHTML = `
    <svg viewBox="0 0 80 80">
      <defs>
        <linearGradient id="beeWing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#BAE6FD"/>
        </linearGradient>
        <clipPath id="beeBody"><ellipse cx="36" cy="44" rx="24" ry="17"/></clipPath>
      </defs>
      <g class="wing wl"><path d="M34 34C26 8 8 6 6 16c-2 10 16 20 28 18z" fill="url(#beeWing)" fill-opacity=".95" stroke="#60A5FA" stroke-width="1.4"/></g>
      <g class="wing wr"><path d="M40 34C48 8 66 6 68 16c2 10-16 20-28 18z" fill="url(#beeWing)" fill-opacity=".95" stroke="#60A5FA" stroke-width="1.4"/></g>
      <path d="M12 44L2 40l10 6z" fill="#1F2937"/>
      <ellipse cx="36" cy="44" rx="24" ry="17" fill="#FACC15"/>
      <g clip-path="url(#beeBody)" fill="#1F2937">
        <rect x="18" y="26" width="7" height="36"/><rect x="32" y="26" width="7" height="36"/><rect x="46" y="26" width="7" height="36"/>
      </g>
      <ellipse cx="36" cy="44" rx="24" ry="17" fill="none" stroke="#1F2937" stroke-width="2.5"/>
      <path d="M31 58l-3 7M39 60l0 6M46 58l4 6" stroke="#1F2937" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M59 30q-3-10-9-13M65 30q3-10 9-13" fill="none" stroke="#1F2937" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="50" cy="17" r="1.8" fill="#1F2937"/><circle cx="74" cy="17" r="1.8" fill="#1F2937"/>
      <circle cx="58" cy="40" r="11" fill="#FACC15" stroke="#1F2937" stroke-width="2.5"/>
      <ellipse cx="62" cy="37" rx="3.2" ry="4.2" fill="#1F2937"/>
      <circle cx="63.2" cy="35.4" r="1.2" fill="#FFFFFF"/>
      <path d="M60 46q4 2.6 8-.6" fill="none" stroke="#1F2937" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="66" cy="43" rx="1.8" ry="1.2" fill="#F87171" opacity=".7"/>
    </svg>`;
  document.body.appendChild(bee);

  const SIZE = 44;
  const OFFSET_X = -22, OFFSET_Y = -20; // lebah berada sedikit di atas-kiri ujung kursor
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

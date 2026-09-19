(function () {
  // Segment map for digits 0-9 (a b c d e f g)
  const SEGMENT_MAP = {
    0: ['a', 'b', 'c', 'd', 'e', 'f'],
    1: ['b', 'c'],
    2: ['a', 'b', 'g', 'e', 'd'],
    3: ['a', 'b', 'c', 'd', 'g'],
    4: ['f', 'g', 'b', 'c'],
    5: ['a', 'f', 'g', 'c', 'd'],
    6: ['a', 'f', 'g', 'e', 'c', 'd'],
    7: ['a', 'b', 'c'],
    8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    9: ['a', 'b', 'c', 'd', 'f', 'g'],
  };

  const ALL_SEGS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  function buildDigit(el) {
    el.innerHTML = '';
    ALL_SEGS.forEach((name) => {
      const seg = document.createElement('div');
      seg.className = 'seg ' + name;
      el.appendChild(seg);
    });
  }

  const digitEls = {
    h1: document.getElementById('h1'),
    h2: document.getElementById('h2'),
    m1: document.getElementById('m1'),
    m2: document.getElementById('m2'),
    s1: document.getElementById('s1'),
    s2: document.getElementById('s2'),
  };

  Object.values(digitEls).forEach(buildDigit);

  function setDigit(el, value) {
    const onSegs = SEGMENT_MAP[value] || [];
    ALL_SEGS.forEach((name) => {
      const seg = el.querySelector('.seg.' + name);
      if (seg) {
        seg.classList.toggle('on', onSegs.includes(name));
      }
    });
  }

  function updateClock() {
    // Always uses the user's real local time
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    // 12-hour format
    const isPM = h >= 12;
    h = h % 12;
    if (h === 0) h = 12;

    document.getElementById('ampm').textContent = isPM ? 'PM' : 'AM';

    setDigit(digitEls.h1, Math.floor(h / 10));
    setDigit(digitEls.h2, h % 10);
    setDigit(digitEls.m1, Math.floor(m / 10));
    setDigit(digitEls.m2, m % 10);
    setDigit(digitEls.s1, Math.floor(s / 10));
    setDigit(digitEls.s2, s % 10);
  }

  // Initial + every second
  updateClock();
  setInterval(updateClock, 1000);

  // ---------- Detect user's country ----------
  async function detectCountry() {
    const locationEl = document.getElementById('location');
    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      const country = data.country || data.country_code || 'Unknown';
      const city = data.city ? data.city + ', ' : '';

      locationEl.textContent = city + country;
      locationEl.classList.add('loaded');
    } catch (err) {
      console.warn('Could not detect country:', err);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        locationEl.textContent = tz ? tz.replace(/_/g, ' ') : 'Local time';
        locationEl.classList.add('loaded');
      } catch (e) {
        locationEl.textContent = 'Local time';
        locationEl.classList.add('loaded');
      }
    }
  }

  detectCountry();

  // ---------- Theme system ----------
  const themes = ['theme-dark', 'theme-light', 'theme-night'];
  const themeIcons = {
    'theme-dark': `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`, // moon
    'theme-light': `<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>`, // sun
    'theme-night': `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/><path d="M19 3v4M21 5h-4"/>` // night
  };

  let currentThemeIndex = 0;

  // Restore saved theme
  const saved = localStorage.getItem('clock-theme');
  if (saved && themes.includes(saved)) {
    currentThemeIndex = themes.indexOf(saved);
  }
  applyTheme(themes[currentThemeIndex]);

  function applyTheme(themeClass) {
    document.body.classList.remove(...themes);
    document.body.classList.add(themeClass);

    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.innerHTML = themeIcons[themeClass] || themeIcons['theme-dark'];
    }

    localStorage.setItem('clock-theme', themeClass);
  }

  document.getElementById('themeBtn').addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme(themes[currentThemeIndex]);
  });

  // ---------- Landscape / fullscreen button ----------
  const btn = document.getElementById('landscapeBtn');

  async function toggleLandscape() {
    try {
      if (!document.fullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }

        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock('landscape');
          } catch (e) {
            console.log('Orientation lock not available:', e.message);
          }
        }
        document.body.classList.add('landscape-mode');
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
        document.body.classList.remove('landscape-mode');
      }
    } catch (err) {
      console.warn('Fullscreen / orientation error:', err);
      document.body.classList.toggle('landscape-mode');
      alert('Fullscreen not supported. Rotate your phone to landscape for the best view.');
    }
  }

  btn.addEventListener('click', toggleLandscape);

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      document.body.classList.remove('landscape-mode');
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    }
  });

  // ========== Ultra-smooth Touch / Mouse Trail ==========
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let lastX = null;
  let lastY = null;
  let lastTime = 0;
  const MAX_PARTICLES = 420;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function getParticleColor() {
    const style = getComputedStyle(document.body);
    return {
      rgb: style.getPropertyValue('--particle').trim() || '220, 230, 255',
      glow: style.getPropertyValue('--particle-glow').trim() || '180, 200, 255'
    };
  }

  function addParticle(x, y, vx, vy) {
    if (particles.length >= MAX_PARTICLES) {
      particles.shift();
    }

    const offset = 3.2;
    particles.push({
      x: x + (Math.random() - 0.5) * offset,
      y: y + (Math.random() - 0.5) * offset,
      size: Math.random() * 2.8 + 1.6,
      life: 1,
      // Very slow decay for long silky trail
      decay: 0.008 + Math.random() * 0.006,
      vx: vx * 0.28 + (Math.random() - 0.5) * 0.28,
      vy: vy * 0.28 + (Math.random() - 0.5) * 0.28,
    });
  }

  function handleMove(x, y) {
    const now = performance.now();
    let vx = 0;
    let vy = 0;

    if (lastX !== null && lastY !== null) {
      const dt = Math.max(6, now - lastTime);
      vx = (x - lastX) / (dt / 16);
      vy = (y - lastY) / (dt / 16);

      const dist = Math.hypot(x - lastX, y - lastY);
      // Very dense sampling for ultra-smooth continuous line
      const steps = Math.max(1, Math.ceil(dist / 2.2));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Smoothstep for fluid interpolation
        const ease = t * t * (3 - 2 * t);
        const px = lastX + (x - lastX) * ease;
        const py = lastY + (y - lastY) * ease;
        addParticle(px, py, vx, vy);
      }
    } else {
      addParticle(x, y, 0, 0);
    }

    lastX = x;
    lastY = y;
    lastTime = now;
  }

  function onPointerMove(e) {
    e.preventDefault();
    if (e.touches && e.touches.length) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      handleMove(e.clientX, e.clientY);
    }
  }

  function onPointerEnd() {
    lastX = null;
    lastY = null;
  }

  window.addEventListener('mousemove', onPointerMove, { passive: false });
  window.addEventListener('mouseup', onPointerEnd);
  window.addEventListener('mouseleave', onPointerEnd);

  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerEnd);
  window.addEventListener('touchcancel', onPointerEnd);

  function animateTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const colors = getParticleColor();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.life -= p.decay;

      // Soft natural drag
      p.vx *= 0.96;
      p.vy *= 0.96;

      p.x += p.vx;
      p.y += p.vy;
      p.size *= 0.988;

      if (p.life <= 0 || p.size < 0.2) {
        particles.splice(i, 1);
        continue;
      }

      // Very smooth ease-out alpha
      const alpha = Math.pow(p.life, 1.45) * 0.92;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colors.rgb}, ${alpha})`;
      ctx.shadowColor = `rgba(${colors.glow}, ${alpha * 0.85})`;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(animateTrail);
  }
  animateTrail();
})();
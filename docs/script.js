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

  // Build the 7 segments inside each digit element
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
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();

    // 12-hour format
    const isPM = h >= 12;
    h = h % 12;
    if (h === 0) h = 12;

    document.getElementById('ampm').textContent = isPM ? 'PM' : 'AM';

    setDigit(digitEls.h1, Math.floor(h / 10));
    setDigit(digitEls.h2, h % 10);
    setDigit(digitEls.m1, Math.floor(m / 10));
    setDigit(digitEls.m2, m % 10);
  }

  // Initial + every second
  updateClock();
  setInterval(updateClock, 1000);

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

  // ========== Touch / Mouse Trail Effect ==========
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let lastX = null;
  let lastY = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function addParticle(x, y) {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
      });
    }
  }

  function handleMove(x, y) {
    if (lastX !== null && lastY !== null) {
      const dist = Math.hypot(x - lastX, y - lastY);
      const steps = Math.max(1, Math.floor(dist / 6));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        addParticle(lastX + (x - lastX) * t, lastY + (y - lastY) * t);
      }
    } else {
      addParticle(x, y);
    }
    lastX = x;
    lastY = y;
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

  // Mouse
  window.addEventListener('mousemove', onPointerMove, { passive: false });
  window.addEventListener('mouseup', onPointerEnd);
  window.addEventListener('mouseleave', onPointerEnd);

  // Touch
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerEnd);
  window.addEventListener('touchcancel', onPointerEnd);

  // Animation loop
  function animateTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay;
      p.x += p.vx;
      p.y += p.vy;
      p.size *= 0.97;

      if (p.life <= 0 || p.size < 0.3) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = p.life * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 230, 255, ${alpha})`;
      ctx.shadowColor = `rgba(180, 200, 255, ${alpha})`;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(animateTrail);
  }
  animateTrail();
})();
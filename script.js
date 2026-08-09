(function () {
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
  };

  Object.values(digitEls).forEach(buildDigit);

  function setDigit(el, value) {
    const onSegs = SEGMENT_MAP[value] || [];
    ALL_SEGS.forEach((name) => {
      const seg = el.querySelector('.seg.' + name);
      if (seg) seg.classList.toggle('on', onSegs.includes(name));
    });
  }

  function updateClock() {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const isPM = h >= 12;
    h = h % 12;
    if (h === 0) h = 12;

    document.getElementById('ampm').textContent = isPM ? 'PM' : 'AM';
    setDigit(digitEls.h1, Math.floor(h / 10));
    setDigit(digitEls.h2, h % 10);
    setDigit(digitEls.m1, Math.floor(m / 10));
    setDigit(digitEls.m2, m % 10);
  }

  updateClock();
  setInterval(updateClock, 1000);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const btn = document.getElementById('landscapeBtn');

  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.webkitCurrentFullScreenElement
    );
  }

  async function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
    if (isIOS) {
      window.scrollTo(0, 1);
      setTimeout(() => window.scrollTo(0, 1), 100);
      return false;
    }
    return false;
  }

  async function exitFullscreen() {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    else if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
  }

  async function toggleLandscape() {
    try {
      if (!isFullscreen()) {
        const ok = await enterFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          try { await screen.orientation.lock('landscape'); } catch (e) {}
        }
        document.body.classList.add('landscape-mode');

        if (isIOS && !ok && !sessionStorage.getItem('iosHintShown')) {
          sessionStorage.setItem('iosHintShown', '1');
          alert('On iPhone: rotate your device to landscape.\n\nFor true full-screen, add this page to your Home Screen (Share → Add to Home Screen).');
        }
      } else {
        await exitFullscreen();
        if (screen.orientation && screen.orientation.unlock) {
          try { screen.orientation.unlock(); } catch (e) {}
        }
        document.body.classList.remove('landscape-mode');
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
      document.body.classList.toggle('landscape-mode');
      if (isIOS) {
        alert('Rotate your iPhone to landscape for the best view.\n\nTip: Add to Home Screen for full-screen mode.');
      }
    }
  }

  btn.addEventListener('click', toggleLandscape);

  function onFsChange() {
    if (!isFullscreen()) {
      document.body.classList.remove('landscape-mode');
      if (screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch (e) {}
      }
    }
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  function fixViewport() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const w = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    document.documentElement.style.height = h + 'px';
    document.body.style.height = h + 'px';
    document.body.style.width = w + 'px';
  }
  fixViewport();
  window.addEventListener('resize', fixViewport);
  window.addEventListener('orientationchange', () => {
    setTimeout(fixViewport, 150);
    setTimeout(fixViewport, 400);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fixViewport);
  }

  // Trail
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let lastX = null;
  let lastY = null;

  function resizeCanvas() {
    const w = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    canvas.width = w * (window.devicePixelRatio || 1);
    canvas.height = h * (window.devicePixelRatio || 1);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas);
  }

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
    if (e.cancelable) e.preventDefault();
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
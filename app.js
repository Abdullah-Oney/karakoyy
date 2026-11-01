(() => {
  'use strict';

  const ART_URL = 'assets/karakoy-illustration.png';
  const LOGO_URL = 'assets/gulluoglu-logo.png';
  const SELF_DELAY = 3000;
  const ANIMATION_MS = 3300;
  const scene = document.getElementById('sceneCanvas');
  const sceneCtx = scene.getContext('2d');
  const preview = document.getElementById('exportPreview');
  const previewCtx = preview.getContext('2d');
  const stageFrame = document.getElementById('stageFrame');
  const stageHint = document.getElementById('stageHint');
  const recipientInput = document.getElementById('recipientName');
  const giftMessageInput = document.getElementById('giftMessage');
  const senderInput = document.getElementById('senderName');
  const giftFields = document.getElementById('giftFields');
  const personalHeading = document.getElementById('personalHeading');
  const personalSubline = document.getElementById('personalSubline');
  const personalGift = document.getElementById('personalGift');
  const toast = document.getElementById('toast');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ART_W = 1774;
  const ART_H = 887;
  scene.width = ART_W;
  scene.height = ART_H;

  let artImage = null;
  let logoImage = null;
  let particles = [];
  let mode = 'self';
  let currentName = 'Kenan';
  let currentMessage = '';
  let currentSender = '';
  let animationFrame = 0;
  let animationStartedAt = 0;
  let toastTimer = 0;
  let recorder = null;
  let recordChunks = [];

  function safeText(value, fallback = '') {
    return String(value || '').replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 150) || fallback;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function getPlaque() {
    return { x: ART_W * 0.16, y: ART_H * 0.30, w: ART_W * 0.68, h: ART_H * 0.42, r: 30 };
  }

  function insidePlaque(x, y, p) {
    const cx = Math.max(p.x + p.r, Math.min(x, p.x + p.w - p.r));
    const cy = Math.max(p.y + p.r, Math.min(y, p.y + p.h - p.r));
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= p.r * p.r || (x >= p.x + p.r && x <= p.x + p.w - p.r && y >= p.y && y <= p.y + p.h) || (y >= p.y + p.r && y <= p.y + p.h - p.r && x >= p.x && x <= p.x + p.w);
  }

  function buildParticles() {
    if (!artImage) return;
    const sample = document.createElement('canvas');
    sample.width = ART_W;
    sample.height = ART_H;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(artImage, 0, 0, ART_W, ART_H);
    const pixels = sctx.getImageData(0, 0, ART_W, ART_H).data;
    const plaque = getPlaque();
    const step = 11;
    particles = [];
    for (let y = 0; y < ART_H; y += step) {
      for (let x = 0; x < ART_W; x += step) {
        const px = x + step * .5;
        const py = y + step * .5;
        if (insidePlaque(px, py, plaque)) continue;
        const i = (Math.min(ART_H - 1, y) * ART_W + Math.min(ART_W - 1, x)) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
        if (a < 8) continue;
        const dx = px - ART_W / 2;
        const dy = py - ART_H / 2;
        const length = Math.max(1, Math.hypot(dx, dy));
        const outward = 0.35 + Math.random() * 0.9;
        particles.push({
          x: px, y: py,
          color: `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`,
          size: step * (.62 + Math.random() * .5),
          vx: (dx / length * outward + (Math.random() - .5) * 1.1) * (180 + Math.random() * 250),
          vy: (dy / length * outward + (Math.random() - .5) * 1.0) * (130 + Math.random() * 220) - Math.random() * 95,
          spin: (Math.random() - .5) * 2,
          lag: Math.random() * .25,
          alpha: .75 + Math.random() * .25
        });
      }
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    });
    if (line) lines.push(line);
    const chosen = lines.slice(0, maxLines);
    const startY = y - ((chosen.length - 1) * lineHeight) / 2;
    chosen.forEach((part, i) => ctx.fillText(part, x, startY + i * lineHeight));
    return chosen.length;
  }

  function getDisplayText() {
    return mode === 'gift' ? currentMessage : currentName;
  }

  function drawLogo(ctx, x, y, maxW, maxH) {
    if (!logoImage) return;
    const ratio = Math.min(maxW / logoImage.width, maxH / logoImage.height);
    const w = logoImage.width * ratio;
    const h = logoImage.height * ratio;
    ctx.drawImage(logoImage, x, y, w, h);
  }

  function drawPlaque(ctx, progress = 1) {
    const p = getPlaque();
    const ease = Math.max(0, Math.min(1, progress));
    if (ease <= 0) return;
    ctx.save();
    ctx.globalAlpha = ease;
    ctx.shadowColor = 'rgba(0, 0, 0, .28)';
    ctx.shadowBlur = 38;
    ctx.shadowOffsetY = 18;
    roundRectPath(ctx, p.x, p.y, p.w, p.h, p.r);
    const fill = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    fill.addColorStop(0, '#f7f0dc');
    fill.addColorStop(.52, '#efe4c8');
    fill.addColorStop(1, '#f9f3e4');
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b98d49';
    ctx.stroke();
    roundRectPath(ctx, p.x + 13, p.y + 13, p.w - 26, p.h - 26, Math.max(10, p.r - 10));
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(170, 126, 59, .55)';
    ctx.stroke();

    const text = getDisplayText();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#173e32';
    if (mode === 'self') {
      let fontSize = 126;
      ctx.font = `600 ${fontSize}px Georgia, serif`;
      while (ctx.measureText(text).width > p.w * .78 && fontSize > 55) {
        fontSize -= 4;
        ctx.font = `600 ${fontSize}px Georgia, serif`;
      }
      ctx.fillText(text, p.x + p.w / 2, p.y + p.h * .43, p.w * .8);
      ctx.fillStyle = '#bb914c';
      ctx.fillRect(p.x + p.w * .39, p.y + p.h * .66, p.w * .22, 2);
    } else {
      ctx.font = '500 55px Georgia, serif';
      const lineCount = wrapText(ctx, text, p.x + p.w / 2, p.y + p.h * .39, p.w * .79, 68, 3);
      ctx.fillStyle = '#a77e41';
      ctx.font = 'italic 27px Georgia, serif';
      ctx.fillText(currentSender ? currentSender : 'Sevgiyle', p.x + p.w / 2, p.y + p.h * (.68 + Math.max(0, lineCount - 1) * .025));
    }
    drawLogo(ctx, p.x + p.w - 190, p.y + p.h - 90, 155, 78);
    ctx.restore();
  }

  function drawSceneFrame(progress, elapsed) {
    const ctx = sceneCtx;
    const plaque = getPlaque();
    ctx.clearRect(0, 0, ART_W, ART_H);
    if (progress <= 0) {
      ctx.drawImage(artImage, 0, 0, ART_W, ART_H);
      return;
    }

    // Keep the central nameplate area while the surrounding artwork breaks into pixels.
    ctx.save();
    roundRectPath(ctx, plaque.x, plaque.y, plaque.w, plaque.h, plaque.r);
    ctx.clip();
    ctx.drawImage(artImage, 0, 0, ART_W, ART_H);
    ctx.restore();

    const ease = 1 - Math.pow(1 - progress, 3);
    const seconds = Math.max(0, elapsed - SELF_DELAY) / 1000;
    for (const part of particles) {
      const local = Math.max(0, Math.min(1, (progress - part.lag) / (1 - part.lag)));
      if (local <= 0) continue;
      const travel = seconds * (0.55 + local * 1.2);
      const fade = Math.max(0, 1 - local * 1.08) * part.alpha;
      if (fade <= .015) continue;
      const x = part.x + part.vx * travel * .55;
      const y = part.y + part.vy * travel * .55 + 45 * travel * travel;
      const size = part.size * (1 - local * .42);
      ctx.globalAlpha = fade;
      ctx.fillStyle = part.color;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    drawPlaque(ctx, Math.min(1, ease * 1.18));
    if (progress >= 1) {
      ctx.clearRect(0, 0, ART_W, ART_H);
      drawPlaque(ctx, 1);
    }
  }

  function drawExport() {
    const ctx = previewCtx;
    const w = preview.width;
    const h = preview.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#173e32';
    if (mode === 'self') {
      let fontSize = 152;
      ctx.font = `600 ${fontSize}px Georgia, serif`;
      while (ctx.measureText(currentName).width > w * .69 && fontSize > 66) {
        fontSize -= 4;
        ctx.font = `600 ${fontSize}px Georgia, serif`;
      }
      ctx.fillText(currentName, w * .43, h * .39, w * .7);
      ctx.fillStyle = '#b98d49';
      ctx.fillRect(w * .32, h * .58, w * .22, 3);
    } else {
      let fontSize = 65;
      ctx.font = `500 ${fontSize}px Georgia, serif`;
      const msg = currentMessage || 'Sana özel, sevgiyle hazırlandı.';
      while (ctx.measureText(msg).width > w * .68 && fontSize > 38) {
        fontSize -= 2;
        ctx.font = `500 ${fontSize}px Georgia, serif`;
      }
      const lines = wrapText(ctx, msg, w * .40, h * .33, w * .69, 82, 3);
      ctx.fillStyle = '#a47a3d';
      ctx.font = 'italic 38px Georgia, serif';
      ctx.fillText(currentSender || 'Sevgiyle', w * .40, h * (.58 + (lines - 1) * .04));
    }
    drawLogo(ctx, w * .70, h * .47, w * .25, h * .38);
    ctx.restore();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3300);
  }

  function updateVisibleText() {
    if (mode === 'gift') {
      personalHeading.textContent = currentName ? `${currentName} için` : 'Sana özel';
      personalSubline.textContent = currentMessage || 'Sevgiyle hazırlanmış bir hediye notu.';
    } else {
      personalHeading.textContent = currentName;
      personalSubline.textContent = 'Bu kutu sizin için özenle hazırlandı.';
    }
    drawExport();
  }

  function setMode(nextMode) {
    mode = nextMode === 'gift' ? 'gift' : 'self';
    document.querySelectorAll('.mode-button').forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    giftFields.hidden = mode !== 'gift';
  }

  function collectPersonalization() {
    currentName = safeText(recipientInput.value, 'Kenan');
    recipientInput.value = currentName;
    currentMessage = safeText(giftMessageInput.value, 'Sana özel, sevgiyle hazırlandı.');
    currentSender = safeText(senderInput.value, 'Sevgiyle');
    updateVisibleText();
  }

  function cancelAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  function runAnimation(record = false) {
    if (!artImage) return;
    cancelAnimation();
    collectPersonalization();
    stageFrame.classList.remove('is-revealing');
    personalGift.classList.remove('is-visible');
    stageHint.textContent = mode === 'gift' ? 'Kutunuzda size özel bir not var' : 'Kutunuzun hikâyesi hazırlanıyor';
    drawSceneFrame(0, 0);
    const started = performance.now();
    let recordingStream = null;
    let localRecorder = null;
    let recorderPromise = Promise.resolve();

    if (record) {
      if (!('MediaRecorder' in window) || !scene.captureStream) {
        showToast('Bu tarayıcı WebM video kaydını desteklemiyor. PNG indirebilirsiniz.');
        record = false;
      } else {
        recordingStream = scene.captureStream(30);
        const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
        if (!mime) {
          showToast('Video biçimi bu tarayıcıda desteklenmiyor. PNG indirebilirsiniz.');
          record = false;
          recordingStream.getTracks().forEach(track => track.stop());
        } else {
          recordChunks = [];
          try {
            localRecorder = new MediaRecorder(recordingStream, { mimeType: mime });
            recorder = localRecorder;
            recorderPromise = new Promise(resolve => {
              localRecorder.ondataavailable = event => { if (event.data && event.data.size) recordChunks.push(event.data); };
              localRecorder.onstop = () => {
                const blob = new Blob(recordChunks, { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `karakoy-gulluoglu-kutusu-${slugify(currentName)}.webm`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                recordingStream.getTracks().forEach(track => track.stop());
                showToast('Kutu animasyonu WebM video olarak indirildi.');
                recorder = null;
                resolve();
              };
              localRecorder.start(250);
            });
          } catch (error) {
            recordingStream.getTracks().forEach(track => track.stop());
            record = false;
            showToast('Video kaydı başlatılamadı. PNG indirebilirsiniz.');
          }
        }
      }
    }

    const duration = reduceMotion ? 1 : ANIMATION_MS;
    const delay = reduceMotion ? 0 : SELF_DELAY;
    const tick = now => {
      const elapsed = now - started;
      if (elapsed < delay) {
        drawSceneFrame(0, elapsed);
        animationFrame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, (elapsed - delay) / duration);
      drawSceneFrame(progress, elapsed);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        animationFrame = 0;
        stageFrame.classList.add('is-revealing');
        stageHint.textContent = mode === 'gift' ? 'Sizin için, sevgiyle…' : `${currentName} için özenle hazırlandı`;
        personalGift.classList.add('is-visible');
        if (localRecorder && localRecorder.state !== 'inactive') {
          setTimeout(() => { try { localRecorder.stop(); } catch (_) {} }, 1000);
        }
      }
    };
    animationFrame = requestAnimationFrame(tick);
    return recorderPromise;
  }

  function slugify(text) {
    return String(text || 'hediye').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'hediye';
  }

  function downloadPng() {
    drawExport();
    preview.toBlob(blob => {
      if (!blob) return showToast('PNG görseli oluşturulamadı.');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gulluoglu-kutusu-${slugify(currentName)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast('Şeffaf arka planlı isim ve logo indirildi.');
    }, 'image/png');
  }

  async function shareToInstagram() {
    drawExport();
    preview.toBlob(async blob => {
      if (!blob) return showToast('Paylaşım görseli oluşturulamadı.');
      const file = new File([blob], `gulluoglu-kutusu-${slugify(currentName)}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({ title: 'Karaköy Güllüoğlu — Sana özel kutu', text: 'Karaköy Güllüoğlu kutumdan bana özel bir hatıra.', files: [file] });
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gulluoglu-kutusu-${slugify(currentName)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      window.open('https://www.instagram.com/karakoygulluoglu/', '_blank', 'noopener,noreferrer');
      showToast('Görsel indirildi. Instagram açıldı; hikâyenize ekleyebilirsiniz.');
    }, 'image/png');
  }

  function applyUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const note = params.get('note');
    const sender = params.get('from');
    const requestedMode = params.get('mode');
    if (name) recipientInput.value = safeText(name, 'Kenan');
    if (note) giftMessageInput.value = safeText(note, 'Sana özel, sevgiyle hazırlandı.');
    if (sender) senderInput.value = safeText(sender, 'Sevgiyle');
    if (requestedMode === 'gift' || note) setMode('gift');
  }

  document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.querySelectorAll('.preset-chip').forEach(button => button.addEventListener('click', () => { recipientInput.value = button.dataset.name; }));
  document.getElementById('applyPersonalization').addEventListener('click', () => {
    collectPersonalization();
    runAnimation(false);
    showToast('Kutu yeni kişisel bilgilerle hazırlandı.');
  });
  document.getElementById('replayButton').addEventListener('click', () => runAnimation(false));
  document.getElementById('downloadPng').addEventListener('click', downloadPng);
  document.getElementById('downloadVideo').addEventListener('click', () => runAnimation(true));
  document.getElementById('instagramShare').addEventListener('click', shareToInstagram);

  async function init() {
    try {
      [artImage, logoImage] = await Promise.all([loadImage(ART_URL), loadImage(LOGO_URL)]);
      buildParticles();
      applyUrlParameters();
      collectPersonalization();
      runAnimation(false);
    } catch (error) {
      sceneCtx.fillStyle = '#123a30';
      sceneCtx.fillRect(0, 0, ART_W, ART_H);
      sceneCtx.fillStyle = '#f4efdf';
      sceneCtx.textAlign = 'center';
      sceneCtx.font = '42px Georgia, serif';
      sceneCtx.fillText('Karaköy Güllüoğlu 1843', ART_W / 2, ART_H / 2);
      showToast('Görsel yüklenemedi. Dosyaların birlikte yüklendiğinden emin olun.');
    }
  }

  init();
})();

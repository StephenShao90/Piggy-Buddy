(() => {
  const stage = document.getElementById("stage");
  const pig = document.getElementById("pig");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const msg = document.getElementById("message");
  const celebrate = document.getElementById("celebrate");
  const fx = document.getElementById("fx");
  const ctx = fx.getContext("2d");

  // ---------- Helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function resizeCanvas() {
    fx.width = Math.floor(window.innerWidth * devicePixelRatio);
    fx.height = Math.floor(window.innerHeight * devicePixelRatio);
    fx.style.width = `${window.innerWidth}px`;
    fx.style.height = `${window.innerHeight}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // ---------- Floating hearts background ----------
  function spawnHearts() {
    const heartChars = ["💗","💖","💘","💞","💕"];
    for (let i = 0; i < 14; i++) {
      const el = document.createElement("div");
      el.className = "heart";
      el.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = `${(80 + Math.random() * 40)}vh`;
      el.style.fontSize = `${14 + Math.random() * 18}px`;
      el.style.animationDuration = `${8 + Math.random() * 8}s`;
      el.style.animationDelay = `${Math.random() * 3}s`;
      stage.appendChild(el);
    }
  }
  spawnHearts();

  // ---------- Pig SVG (sadness controlled by variable s in [0..1]) ----------
  function pigSVG(sad = 0) {
    // sad: 0 = normal, 1 = very sad
    const earDropL = lerp(0, -18, sad);
    const earDropR = lerp(0, -14, sad);
    const headTilt = lerp(0, 10, sad);
    const tearOpacity = clamp(sad * 1.2, 0, 1);
    const blushOpacity = lerp(0.20, 0.05, sad);
    const mouthOpacity = 0; // no mouth by design

    // “cheer” will override later on YES
    return `
      <div style="width:100%;height:100%;transform:translate(-50%,-50%) rotate(${headTilt}deg);transform-origin:50% 70%;">
        <svg viewBox="0 0 200 210" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="195" rx="46" ry="9" fill="rgba(0,0,0,0.16)"/>
          <!-- Body -->
          <circle cx="100" cy="148" r="42" fill="#f3a6c2"/>
          <circle cx="112" cy="154" r="17" fill="#ef97b6" opacity="${blushOpacity}"/>

          <!-- Legs -->
          <rect x="84" y="174" width="18" height="26" rx="9" fill="#d98ca8"/>
          <rect x="74" y="192" width="38" height="12" rx="6" fill="#c97796"/>
          <rect x="98" y="174" width="18" height="26" rx="9" fill="#d98ca8"/>
          <rect x="88" y="192" width="38" height="12" rx="6" fill="#c97796"/>

          <!-- Arms -->
          <path d="M74 132 C56 140, 46 150, 38 158" stroke="#c97796" stroke-width="14" stroke-linecap="round" fill="none"/>
          <path d="M126 132 C144 140, 154 150, 162 158" stroke="#c97796" stroke-width="14" stroke-linecap="round" fill="none"/>

          <!-- Head -->
          <g>
            <circle cx="100" cy="82" r="56" fill="#f3a6c2"/>

            <!-- Ears droop with sadness -->
            <g style="transform-origin:72px 58px; transform: rotate(${earDropL}deg);">
              <path d="M72 58 L40 28 L80 32 Z" fill="#f3a6c2"/>
              <path d="M72 58 L52 40 L79 42 Z" fill="#ef97b6"/>
            </g>
            <g style="transform-origin:128px 58px; transform: rotate(${earDropR}deg);">
              <path d="M128 58 L120 24 L160 42 Z" fill="#f3a6c2"/>
              <path d="M128 58 L125 40 L152 48 Z" fill="#ef97b6"/>
            </g>

            <!-- Eyes -->
            <ellipse cx="83" cy="78" rx="5.2" ry="8.0" fill="#2b1b22" opacity="${lerp(1, 0.85, sad)}"/>
            <ellipse cx="117" cy="78" rx="5.2" ry="8.0" fill="#2b1b22" opacity="${lerp(1, 0.85, sad)}"/>

            <!-- Tears appear as sadness grows -->
            <g opacity="${tearOpacity}">
              <path d="M78 92 C74 98, 74 108, 80 114 C86 108, 86 98, 82 92 Z" fill="rgba(122,196,255,0.55)"/>
              <path d="M118 92 C114 98, 114 108, 120 114 C126 108, 126 98, 122 92 Z" fill="rgba(122,196,255,0.55)"/>
            </g>

            <!-- Big Nose -->
            <ellipse cx="100" cy="110" rx="20" ry="15" fill="#ef97b6"/>
            <ellipse cx="91.5" cy="110" rx="3.8" ry="6.6" fill="#9b4a62"/>
            <ellipse cx="108.5" cy="110" rx="3.8" ry="6.6" fill="#9b4a62"/>

            <!-- Bandage (he fell on butt unconscious) -->
            <g>
              <rect x="58" y="42" width="94" height="24" rx="12"
                    fill="#f5f0e6" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
              <rect x="70" y="47" width="14" height="14" rx="5" fill="rgba(0,0,0,0.06)"/>
              <rect x="97" y="47" width="14" height="14" rx="5" fill="rgba(0,0,0,0.06)"/>
              <rect x="124" y="47" width="14" height="14" rx="5" fill="rgba(0,0,0,0.06)"/>
            </g>

            <!-- no mouth -->
            <g opacity="${mouthOpacity}"></g>
          </g>
        </svg>
      </div>
    `;
  }

  // ---------- Pig fall to center ----------
  let pigX = window.innerWidth / 2;
  let pigY = -120;
  let vy = 0;
  const gravity = 2400;
  const targetY = window.innerHeight * 0.60;

  let fell = false;
  let sadness = 0;   // 0..1
  let noCount = 0;

  function renderPig() {
    pig.innerHTML = pigSVG(sadness);
    pig.style.left = `${pigX}px`;
    pig.style.top = `${pigY}px`;
    pig.style.transform = "translate(-50%, -50%)";
  }
  renderPig();

  // ---------- Button scaling (respectful cap) ----------
  // We'll do the classic gag, but cap so No never disappears.
  let yesScale = 1;
  let noScale = 1;

  function applyButtonScales() {
    yesBtn.style.transform = `scale(${yesScale})`;
    noBtn.style.transform = `scale(${noScale})`;
    noBtn.style.opacity = String(clamp(0.95 - noCount * 0.07, 0.45, 0.95));
  }

  function setMessage(text) {
    msg.textContent = text || "";
  }

  // ---------- Fireworks / confetti ----------
  const confetti = [];
  let celebrating = false;

  function burstConfetti(x, y) {
    const n = 160;
    for (let i = 0; i < n; i++) {
      confetti.push({
        x, y,
        vx: (Math.random() - 0.5) * 900,
        vy: - (400 + Math.random() * 700),
        g: 1400 + Math.random() * 600,
        r: 2 + Math.random() * 4,
        life: 1.2 + Math.random() * 1.0,
        t: 0
      });
    }
  }

  function drawConfetti(dt) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.t += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const alpha = clamp(1 - p.t / p.life, 0, 1);
      if (alpha <= 0) {
        confetti.splice(i, 1);
        continue;
      }

      // no fixed colors requested; but canvas needs a fillStyle
      // We'll choose from a small festive palette.
      const palette = ["#ff4d8d", "#ff7ab3", "#ffd166", "#7bdff2", "#b8f2a6", "#cdb4ff"];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = palette[i % palette.length];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Main loop ----------
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // fall
    if (!fell) {
      vy += gravity * dt;
      pigY += vy * dt;

      if (pigY >= targetY) {
        pigY = targetY;
        fell = true;
        vy = 0;
        setMessage("He bonked his head… 😵‍💫");
      }
      renderPig();
    } else if (celebrating) {
      // pig celebration bounce
      const t = now / 1000;
      const bounce = Math.sin(t * 10) * 8;
      pig.style.top = `${targetY + bounce}px`;
    }

    // fireworks
    if (confetti.length > 0) drawConfetti(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ---------- Interaction ----------
  function onNoClick() {
    noCount++;

    // Make it gradually harder but not impossible
    yesScale = clamp(yesScale * 1.18, 1, 6.0);
    noScale = clamp(noScale * 0.88, 0.55, 1);

    applyButtonScales();

    // Pig gets sadder
    sadness = clamp(sadness + 0.18, 0, 1);
    renderPig();

    const lines = [
      "Aww… are you sure? 🥺",
      "Piggy is getting worried…",
      "He’s trying his best… 💗",
      "Okay okay… last chance?",
      "No worries either way 💛"
    ];
    setMessage(lines[Math.min(noCount - 1, lines.length - 1)]);

    // If they click No a lot, stop escalating and be respectful
    if (noCount >= 6) {
      // Lock scales (still playful)
      yesScale = clamp(yesScale, 1, 6.0);
      noScale = clamp(noScale, 0.55, 1);
      applyButtonScales();
      setMessage("No worries 💛 Thanks for being honest.");
    }
  }

  function onYesClick() {
    celebrating = true;

    // Make UI celebratory
    celebrate.style.display = "grid";
    document.getElementById("card").style.opacity = "0.0";
    document.getElementById("card").style.pointerEvents = "none";

    // Pig becomes happy: sadness -> 0
    sadness = 0;
    renderPig();

    // Fireworks burst from center
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.35);
    setMessage("");

    // A couple more bursts
    setTimeout(() => burstConfetti(window.innerWidth * 0.25, window.innerHeight * 0.45), 250);
    setTimeout(() => burstConfetti(window.innerWidth * 0.75, window.innerHeight * 0.45), 450);
  }

  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!fell) return; // wait for fall
    if (celebrating) return;
    onNoClick();
  });

  yesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!fell) return;
    if (celebrating) return;
    onYesClick();
  });

  // Start button scales
  applyButtonScales();
})();

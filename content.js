(() => {
  if (window.__PIGGY_ALLINONE_V1__) return;
  window.__PIGGY_ALLINONE_V1__ = true;

  const CONFIG = {
    inset: 40,

    // Movement
    borderSpeed: 155,
    followSpeed: 220,
    followTriggerDist: 200,
    followStopDist: 24,

    // Size
    scale: 0.6,

    // Walk cycle
    bobAmp: 2.0,
    bobFreq: 8.0,
    legAmp: 20,
    legFreq: 9.5,
    armAmp: 12,
    armFreq: 9.5,
    hipSwayAmp: 2.6,

    // Sleep
    sleepAfterMs: 20000,
    sleepBreathAmp: 1.6,
    sleepBreathFreq: 2.0,

    // Blink (awake only)
    blinkMinMs: 1800,
    blinkMaxMs: 5200,
    blinkDurationMs: 140,

    // Face tracking
    faceMaxOffset: 5.5,

    // KO (double click)
    koTiltDeg: 90,

    // Petting heal (KO only, left hold + swipes)
    koPetSeconds: 3.0,
    petMinMovePx: 8,
    petMinDirFlips: 6,
    petTimeSpeedGate: 80,

    // Right-drag (all modes)
    dragButton: 2, // right click
    dragClampToViewport: true,

    // Throw (awake only, while right-dragging)
    throwSpeedPxPerSec: 1250,
    throwZonePx: 60,
    outwardDotMin: 0.65,

    // Panic (awake only, while right-dragging)
    panicShakeDeg: 10,
    panicBobPx: 2.5,
    panicFreq: 22
  };

  // ---------------- DOM ----------------
  const root = document.createElement("div");
  root.id = "piggy-overlay-root";

  const actor = document.createElement("div");
  actor.id = "piggy-actor";
  actor.title =
    "Click: reset sleep timer. Double-click: KO. KO: left-hold + pet to heal. Right-hold drag anytime; if awake, panic + throw.";

  actor.innerHTML = `
    <div id="piggy-rig" style="--pig-scale:${CONFIG.scale}; --pig-flip:1; --pig-bob:0px; --pig-tilt:0deg;">
      <svg id="piggy-svg" viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg">

        <!-- Shadow -->
        <ellipse id="shadow" cx="100" cy="195" rx="46" ry="9" fill="rgba(0,0,0,0.18)"/>

        <!-- Zs -->
        <g id="sleepZs" opacity="0">
          <text x="150" y="34" font-size="18" fill="rgba(0,0,0,0.35)">Z</text>
          <text x="166" y="20" font-size="14" fill="rgba(0,0,0,0.28)">Z</text>
          <text x="176" y="10" font-size="10" fill="rgba(0,0,0,0.22)">z</text>
        </g>

        <!-- Arms (short + fat) -->
        <g id="armL" class="pig-bone pig-limb">
          <path d="M74 132 C56 140, 46 150, 38 158"
                stroke="#c97796" stroke-width="14" stroke-linecap="round" fill="none"/>
        </g>
        <g id="armR" class="pig-bone pig-limb">
          <path d="M126 132 C144 140, 154 150, 162 158"
                stroke="#c97796" stroke-width="14" stroke-linecap="round" fill="none"/>
        </g>

        <!-- Body (smaller than head) -->
        <g id="body" class="pig-bone">
          <circle cx="100" cy="148" r="42" fill="#f3a6c2"/>
          <circle cx="112" cy="154" r="17" fill="#ef97b6" opacity="0.85"/>
        </g>

        <!-- Legs (short + fat) -->
        <g id="legL" class="pig-bone pig-limb">
          <rect x="84" y="174" width="18" height="26" rx="9" fill="#d98ca8"/>
          <rect x="74" y="192" width="38" height="12" rx="6" fill="#c97796"/>
        </g>
        <g id="legR" class="pig-bone pig-limb">
          <rect x="98" y="174" width="18" height="26" rx="9" fill="#d98ca8"/>
          <rect x="88" y="192" width="38" height="12" rx="6" fill="#c97796"/>
        </g>

        <!-- Head (bigger) -->
        <g id="head" class="pig-bone">
          <circle cx="100" cy="82" r="56" fill="#f3a6c2"/>

          <!-- Big ears -->
          <g id="earL" class="pig-bone">
            <path d="M72 58 L40 28 L80 32 Z" fill="#f3a6c2"/>
            <path d="M72 58 L52 40 L79 42 Z" fill="#ef97b6"/>
          </g>
          <g id="earR" class="pig-bone">
            <path d="M128 58 L120 24 L160 42 Z" fill="#f3a6c2"/>
            <path d="M128 58 L125 40 L152 48 Z" fill="#ef97b6"/>
          </g>

          <!-- Bandage (KO only) -->
          <g id="bandage" opacity="0">
            <rect x="58" y="42" width="94" height="24" rx="12"
                  fill="#f5f0e6" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
            <rect x="70" y="47" width="14" height="14" rx="5" fill="rgba(0,0,0,0.06)"/>
            <rect x="97" y="47" width="14" height="14" rx="5" fill="rgba(0,0,0,0.06)"/>
            <rect x="124" y="47" width="14" height="14" rx="5" fill="rgba(0,0,0,0.06)"/>
          </g>

          <!-- Face group -->
          <g id="face" class="pig-bone pig-face">
            <!-- Eyes open -->
            <g id="eyeOpen">
              <ellipse cx="83" cy="78" rx="5.2" ry="8.0" fill="#2b1b22"/>
              <ellipse cx="117" cy="78" rx="5.2" ry="8.0" fill="#2b1b22"/>
            </g>

            <!-- Sleep eyes -->
            <g id="eyeSleep" opacity="0">
              <path d="M76 80 C82 86, 88 86, 94 80" stroke="#2b1b22" stroke-width="3"
                    fill="none" stroke-linecap="round"/>
              <path d="M106 80 C112 86, 118 86, 124 80" stroke="#2b1b22" stroke-width="3"
                    fill="none" stroke-linecap="round"/>
            </g>

            <!-- KO eyes -->
            <g id="eyeKO" opacity="0">
              <path d="M76 74 L90 88 M90 74 L76 88" stroke="#2b1b22" stroke-width="3" stroke-linecap="round"/>
              <path d="M110 74 L124 88 M124 74 L110 88" stroke="#2b1b22" stroke-width="3" stroke-linecap="round"/>
            </g>

            <!-- Big nose -->
            <g id="nose">
              <ellipse cx="100" cy="110" rx="20" ry="15" fill="#ef97b6"/>
              <ellipse cx="91.5" cy="110" rx="3.8" ry="6.6" fill="#9b4a62"/>
              <ellipse cx="108.5" cy="110" rx="3.8" ry="6.6" fill="#9b4a62"/>
            </g>
          </g>
        </g>
      </svg>
    </div>
  `;

  root.appendChild(actor);
  document.documentElement.appendChild(root);

  const rig = actor.querySelector("#piggy-rig");
  const bones = {
    shadow: actor.querySelector("#shadow"),
    sleepZs: actor.querySelector("#sleepZs"),
    bandage: actor.querySelector("#bandage"),
    face: actor.querySelector("#face"),
    earL: actor.querySelector("#earL"),
    earR: actor.querySelector("#earR"),
    armL: actor.querySelector("#armL"),
    armR: actor.querySelector("#armR"),
    legL: actor.querySelector("#legL"),
    legR: actor.querySelector("#legR"),
    eyeOpen: actor.querySelector("#eyeOpen"),
    eyeSleep: actor.querySelector("#eyeSleep"),
    eyeKO: actor.querySelector("#eyeKO"),
  };

  // ---------------- helpers ----------------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  function setRotate(el, deg) {
    if (!el) return;
    el.style.transform = `rotate(${deg}deg)`;
  }

  function setTranslate(el, x, y) {
    if (!el) return;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  // ---------------- border path ----------------
  function rectPerimeter(w, h, inset) {
    const width = Math.max(10, (w - inset) - inset);
    const height = Math.max(10, (h - inset) - inset);
    return 2 * (width + height);
  }

  function getRectPathPoint(s, w, h, inset) {
    const left = inset, top = inset, right = w - inset, bottom = h - inset;
    const width = Math.max(10, right - left);
    const height = Math.max(10, bottom - top);
    const perim = 2 * (width + height);

    let t = ((s % perim) + perim) % perim;

    if (t <= width) return { x: left + t, y: top, vx: 1, vy: 0 };
    t -= width;

    if (t <= height) return { x: right, y: top + t, vx: 0, vy: 1 };
    t -= height;

    if (t <= width) return { x: right - t, y: bottom, vx: -1, vy: 0 };
    t -= width;

    return { x: left, y: bottom - t, vx: 0, vy: -1 };
  }

  function nearestBorderS(x, y, w, h, inset) {
    const left = inset, top = inset, right = w - inset, bottom = h - inset;
    const width = Math.max(10, right - left);
    const height = Math.max(10, bottom - top);
    const perim = 2 * (width + height);

    const cxTop = clamp(x, left, right), cyTop = top;
    const cxBottom = clamp(x, left, right), cyBottom = bottom;
    const cxLeft = left, cyLeft = clamp(y, top, bottom);
    const cxRight = right, cyRight = clamp(y, top, bottom);

    const cands = [
      { edge: "top", px: cxTop, py: cyTop, d2: (x - cxTop) ** 2 + (y - cyTop) ** 2 },
      { edge: "right", px: cxRight, py: cyRight, d2: (x - cxRight) ** 2 + (y - cyRight) ** 2 },
      { edge: "bottom", px: cxBottom, py: cyBottom, d2: (x - cxBottom) ** 2 + (y - cyBottom) ** 2 },
      { edge: "left", px: cxLeft, py: cyLeft, d2: (x - cxLeft) ** 2 + (y - cyLeft) ** 2 }
    ];
    cands.sort((a, b) => a.d2 - b.d2);
    const best = cands[0];

    let s = 0;
    if (best.edge === "top") s = (best.px - left);
    else if (best.edge === "right") s = width + (best.py - top);
    else if (best.edge === "bottom") s = width + height + (right - best.px);
    else s = width + height + width + (bottom - best.py);

    return ((s % perim) + perim) % perim;
  }

  // ---------------- border side info for throw ----------------
  function nearestBorderInfo(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const dLeft = x;
    const dRight = w - x;
    const dTop = y;
    const dBottom = h - y;

    let side = "left";
    let dist = dLeft;

    if (dRight < dist) { side = "right"; dist = dRight; }
    if (dTop < dist) { side = "top"; dist = dTop; }
    if (dBottom < dist) { side = "bottom"; dist = dBottom; }

    // t along that side in [0..1]
    let t = 0.5;
    if (side === "left" || side === "right") t = clamp(y / Math.max(1, h), 0, 1);
    else t = clamp(x / Math.max(1, w), 0, 1);

    let nx = 0, ny = 0;
    if (side === "left") nx = -1;
    if (side === "right") nx = 1;
    if (side === "top") ny = -1;
    if (side === "bottom") ny = 1;

    return { side, dist, t, nx, ny };
  }

  // ---------------- mouse tracking ----------------
  const mouse = { x: 0, y: 0, has: false };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.has = true;
  }, { passive: true });

  // ---------------- state machine ----------------
  // mode: "awake" | "sleep" | "ko"
  let mode = "awake";
  let lastPigClick = performance.now();

  let following = false;
  let prevFollowing = false;

  // Position/direction
  const pos = { x: 60, y: 60 };
  const vel = { x: 1, y: 0 };
  let s = 0;

  // Blink
  let isBlinking = false;
  let nextBlinkAt = performance.now() + rand(CONFIG.blinkMinMs, CONFIG.blinkMaxMs);

  // ---------------- right-drag + throw ----------------
  const drag = {
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    lastT: 0,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
    panicT0: 0,
    suppressContextMenu: false
  };

  actor.addEventListener("contextmenu", (e) => {
    if (drag.suppressContextMenu) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function startRightDrag(e) {
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.offsetX = pos.x - e.clientX;
    drag.offsetY = pos.y - e.clientY;

    drag.lastT = performance.now();
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.vx = 0;
    drag.vy = 0;

    drag.panicT0 = performance.now();
    drag.suppressContextMenu = true;

    try { actor.setPointerCapture(e.pointerId); } catch {}
  }

  function stopRightDrag(pointerId) {
    drag.active = false;
    drag.pointerId = null;
    drag.suppressContextMenu = false;

    // reset panic transforms
    rig.style.setProperty("--pig-tilt", "0deg");
    rig.style.setProperty("--pig-bob", "0px");

    try { actor.releasePointerCapture(pointerId); } catch {}
  }

  function applyPanic(nowMs) {
    if (mode !== "awake") return; // panic only if awake

    const t = (nowMs - drag.panicT0) / 1000;
    const shake = Math.sin(t * CONFIG.panicFreq) * CONFIG.panicShakeDeg;
    const bob = Math.sin(t * (CONFIG.panicFreq * 0.7)) * CONFIG.panicBobPx;

    rig.style.setProperty("--pig-tilt", `${shake}deg`);
    rig.style.setProperty("--pig-bob", `${bob}px`);

    // make limbs a little more frantic while grabbed
    setRotate(bones.armL, -shake * 0.8);
    setRotate(bones.armR, shake * 0.8);
    setRotate(bones.legL, shake * 0.5);
    setRotate(bones.legR, -shake * 0.5);
  }

  function speed() {
    return Math.hypot(drag.vx, drag.vy);
  }

  function tryThrowIfEligible() {
    if (mode !== "awake") return false; // throw only if awake

    const spd = speed();
    if (spd < CONFIG.throwSpeedPxPerSec) return false;

    const b = nearestBorderInfo(pos.x, pos.y);
    if (b.dist > CONFIG.throwZonePx) return false;

    const vxn = drag.vx / Math.max(1e-6, spd);
    const vyn = drag.vy / Math.max(1e-6, spd);
    const outwardDot = vxn * b.nx + vyn * b.ny;
    if (outwardDot < CONFIG.outwardDotMin) return false;

    // THROW!
    doThrow(b.side, b.t);
    return true;
  }

  function doThrow(side, t) {
    // stop drag
    const pid = drag.pointerId;
    stopRightDrag(pid);

    // remove pig
    actor.remove();

    // open fall window
    let url = "fall.html";
    try { url = chrome.runtime.getURL("fall.html"); } catch {}

    const u = new URL(url, window.location.href);
    u.searchParams.set("side", side);
    u.searchParams.set("t", String(t));

    window.open(u.toString(), "piggy-fall-window", "popup=yes,width=420,height=640");
  }

  // ---------------- KO petting heal (left hold + swipes) ----------------
  const pet = {
    active: false,
    lastT: 0,
    lastX: 0,
    lastY: 0,
    accumSeconds: 0,
    dirFlips: 0,
    lastDirSign: 0,
    pointerId: null
  };

  function petReset() {
    pet.active = false;
    pet.accumSeconds = 0;
    pet.dirFlips = 0;
    pet.lastDirSign = 0;
    pet.pointerId = null;
  }

  function startPetting(e) {
    pet.active = true;
    pet.pointerId = e.pointerId;
    pet.lastT = performance.now();
    pet.lastX = e.clientX;
    pet.lastY = e.clientY;
    pet.accumSeconds = 0;
    pet.dirFlips = 0;
    pet.lastDirSign = 0;
    try { actor.setPointerCapture(e.pointerId); } catch {}
  }

  function handlePetMove(e) {
    if (!pet.active || mode !== "ko" || e.pointerId !== pet.pointerId) return;

    const now = performance.now();
    const dt = (now - pet.lastT) / 1000;
    if (dt <= 0) return;

    const dx = e.clientX - pet.lastX;
    const dy = e.clientY - pet.lastY;
    const dist = Math.hypot(dx, dy);
    const spd = dist / dt;

    const axis = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    const sign = axis > 0 ? 1 : axis < 0 ? -1 : 0;

    if (dist >= CONFIG.petMinMovePx && sign !== 0) {
      if (pet.lastDirSign !== 0 && sign !== pet.lastDirSign) pet.dirFlips += 1;
      pet.lastDirSign = sign;
    }

    if (spd >= CONFIG.petTimeSpeedGate) pet.accumSeconds += dt;

    pet.lastT = now;
    pet.lastX = e.clientX;
    pet.lastY = e.clientY;

    if (pet.accumSeconds >= CONFIG.koPetSeconds && pet.dirFlips >= CONFIG.petMinDirFlips) {
      pet.active = false;
      lastPigClick = now;
      wake(now);
    }
  }

  // ---------------- pointer handlers ----------------
  actor.addEventListener("pointerdown", (e) => {
    // Right-click drag (all modes)
    if (e.button === CONFIG.dragButton) {
      e.preventDefault();
      e.stopPropagation();
      startRightDrag(e);
      return;
    }

    // Left-click petting only in KO
    if (mode === "ko" && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      startPetting(e);
    }
  });

  actor.addEventListener("pointermove", (e) => {
    // Right-drag move
    if (drag.active && e.pointerId === drag.pointerId) {
      e.preventDefault();
      e.stopPropagation();

      const now = performance.now();
      const dt = (now - drag.lastT) / 1000;

      if (dt > 1e-4) {
        drag.vx = (e.clientX - drag.lastX) / dt;
        drag.vy = (e.clientY - drag.lastY) / dt;
      }

      drag.lastT = now;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;

      let nx = e.clientX + drag.offsetX;
      let ny = e.clientY + drag.offsetY;

      if (CONFIG.dragClampToViewport) {
        nx = clamp(nx, 20, window.innerWidth - 20);
        ny = clamp(ny, 20, window.innerHeight - 20);
      }

      pos.x = nx;
      pos.y = ny;
      actor.style.left = `${pos.x}px`;
      actor.style.top = `${pos.y}px`;

      // While right-dragging, we don't do border/mouse movement
      // Panic if awake
      applyPanic(now);

      // Throw check (awake only)
      if (tryThrowIfEligible()) return;

      // Keep face neutral while dragged (optional; feels nicer)
      if (mode !== "awake") setTranslate(bones.face, 0, 0);

      return;
    }

    // Petting move
    if (pet.active) handlePetMove(e);
  }, { passive: false });

  actor.addEventListener("pointerup", (e) => {
    // right drag end
    if (drag.active && e.pointerId === drag.pointerId) {
      stopRightDrag(e.pointerId);
      return;
    }

    // pet end
    if (pet.active && e.pointerId === pet.pointerId) {
      pet.active = false;
      try { actor.releasePointerCapture(e.pointerId); } catch {}
    }
  });

  actor.addEventListener("pointercancel", () => {
    if (drag.active) stopRightDrag(drag.pointerId);
    petReset();
  });

  // Click resets sleep timer (and wakes sleep). KO: click alone does not heal.
  actor.addEventListener("click", (e) => {
    // If right-drag just ended, click might still fire; ignore if we were dragging.
    if (drag.suppressContextMenu) return;

    e.preventDefault();
    e.stopPropagation();

    const now = performance.now();
    lastPigClick = now;
    if (mode === "sleep") wake(now);
  });

  // Double click KO
  actor.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const now = performance.now();
    if (mode !== "ko") knockOut(now);
  });

  // ---------------- face state helpers ----------------
  function setFaceOpen() {
    bones.eyeOpen.style.opacity = "1";
    bones.eyeSleep.style.opacity = "0";
    bones.eyeKO.style.opacity = "0";
    bones.bandage.style.opacity = "0";
  }
  function setFaceSleep() {
    bones.eyeOpen.style.opacity = "0";
    bones.eyeSleep.style.opacity = "1";
    bones.eyeKO.style.opacity = "0";
    bones.bandage.style.opacity = "0";
  }
  function setFaceKO() {
    bones.eyeOpen.style.opacity = "0";
    bones.eyeSleep.style.opacity = "0";
    bones.eyeKO.style.opacity = "1";
    bones.bandage.style.opacity = "1";
  }

  function goSleep(now) {
    mode = "sleep";
    bones.sleepZs.style.opacity = "1";
    setFaceSleep();
    rig.style.setProperty("--pig-tilt", "8deg");
  }

  function wake(now) {
    mode = "awake";
    bones.sleepZs.style.opacity = "0";
    setFaceOpen();
    rig.style.setProperty("--pig-tilt", "0deg");
    nextBlinkAt = now + rand(CONFIG.blinkMinMs, CONFIG.blinkMaxMs);
    isBlinking = false;
  }

  function knockOut(now) {
    mode = "ko";
    bones.sleepZs.style.opacity = "1";
    setFaceKO();
    rig.style.setProperty("--pig-tilt", `${CONFIG.koTiltDeg}deg`);
    following = false;
    prevFollowing = false;
    petReset();
  }

  // ---------------- blink ----------------
  function startBlink(now) {
    if (mode !== "awake") return;
    isBlinking = true;
    bones.eyeOpen.style.transform = "scaleY(0.08)";
    setTimeout(() => {
      bones.eyeOpen.style.transform = "scaleY(1)";
      isBlinking = false;
      nextBlinkAt = now + rand(CONFIG.blinkMinMs, CONFIG.blinkMaxMs);
    }, CONFIG.blinkDurationMs);
  }

  // ---------------- main loop ----------------
  let lastT = performance.now();

  function tick(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    // If right-dragging, we freeze autonomous motion (drag updates position directly)
    if (drag.active) {
      requestAnimationFrame(tick);
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Sleep trigger (only from awake)
    if (mode === "awake" && now - lastPigClick >= CONFIG.sleepAfterMs) {
      goSleep(now);
    }

    // Follow decision (awake only)
    if (mode === "awake" && mouse.has) {
      const dx = mouse.x - pos.x;
      const dy = mouse.y - pos.y;
      const dist = Math.hypot(dx, dy);
      following = dist <= CONFIG.followTriggerDist;
    } else {
      following = false;
    }

    // Sleep / KO animations (no movement)
    if (mode === "sleep" || mode === "ko") {
      const t = now / 1000;
      const breathMul = mode === "ko" ? 1.2 : 1.0;
      const breathFreq = mode === "ko" ? CONFIG.sleepBreathFreq * 0.9 : CONFIG.sleepBreathFreq;
      const breath = Math.sin(t * breathFreq) * (CONFIG.sleepBreathAmp * breathMul);

      rig.style.setProperty("--pig-bob", `${breath}px`);

      setRotate(bones.legL, 16);
      setRotate(bones.legR, -10);
      setRotate(bones.armL, 10);
      setRotate(bones.armR, -8);

      // ears droop
      setRotate(bones.earL, -6);
      setRotate(bones.earR, -4);

      setTranslate(bones.face, 0, 0);
      if (bones.shadow) bones.shadow.setAttribute("rx", String(46 + breath * 0.7));

      actor.style.left = `${pos.x}px`;
      actor.style.top = `${pos.y}px`;

      requestAnimationFrame(tick);
      return;
    }

    // Awake movement: chase mouse or walk border
    const t = now / 1000;

    if (following && mouse.has) {
      const dx = mouse.x - pos.x;
      const dy = mouse.y - pos.y;
      const dist = Math.hypot(dx, dy);

      let mx = 0, my = 0;
      if (dist > 1e-6) { mx = dx / dist; my = dy / dist; }

      let speed = CONFIG.followSpeed;
      if (dist <= CONFIG.followStopDist) speed = 0;

      pos.x += mx * speed * dt;
      pos.y += my * speed * dt;

      if (speed > 0.01 && (Math.abs(mx) + Math.abs(my)) > 0.0001) {
        vel.x = mx; vel.y = my;
      } else if (dist > 1e-6) {
        vel.x = mx; vel.y = my;
      }
    } else {
      // If we just stopped following, jump to nearest border position
      if (prevFollowing && !following) {
        s = nearestBorderS(pos.x, pos.y, w, h, CONFIG.inset);
      }

      const perim = rectPerimeter(w, h, CONFIG.inset);
      s = (s + CONFIG.borderSpeed * dt) % perim;

      const pt = getRectPathPoint(s, w, h, CONFIG.inset);
      pos.x = pt.x; pos.y = pt.y;
      vel.x = pt.vx; vel.y = pt.vy;
    }

    actor.style.left = `${pos.x}px`;
    actor.style.top = `${pos.y}px`;

    // Flip based on x direction
    const flip = vel.x < -0.15 ? -1 : 1;
    rig.style.setProperty("--pig-flip", String(flip));

    // Walk cycle intensity
    const movingFactor = (following && mouse.has)
      ? (() => {
          const dx = mouse.x - pos.x, dy = mouse.y - pos.y;
          const dist = Math.hypot(dx, dy);
          return dist <= CONFIG.followStopDist ? 0.2 : 1.0;
        })()
      : 1.0;

    const bob = Math.sin(t * CONFIG.bobFreq) * CONFIG.bobAmp * movingFactor;
    rig.style.setProperty("--pig-bob", `${bob}px`);

    const sway = Math.sin(t * CONFIG.legFreq) * CONFIG.hipSwayAmp * movingFactor;
    rig.style.setProperty("--pig-tilt", `${sway}deg`);

    const legSwing = Math.sin(t * CONFIG.legFreq) * CONFIG.legAmp * movingFactor;
    setRotate(bones.legL, legSwing);
    setRotate(bones.legR, -legSwing);

    const armSwing = Math.sin(t * CONFIG.armFreq) * CONFIG.armAmp * movingFactor;
    setRotate(bones.armL, -armSwing);
    setRotate(bones.armR, armSwing);

    // ear wiggle
    setRotate(bones.earL, Math.sin(t * (CONFIG.bobFreq * 0.9)) * 4.0 * movingFactor);
    setRotate(bones.earR, Math.sin(t * (CONFIG.bobFreq * 0.9) + 1.2) * 3.4 * movingFactor);

    // Face look: IMPORTANT FIX: translateX must account for flip
    const fx = clamp(vel.x, -1, 1) * CONFIG.faceMaxOffset * flip;
    const fy = clamp(vel.y, -1, 1) * CONFIG.faceMaxOffset * 0.65;
    setTranslate(bones.face, fx, fy);

    if (bones.shadow) bones.shadow.setAttribute("rx", String(46 + bob * 0.5));

    if (!isBlinking && now >= nextBlinkAt) startBlink(now);

    prevFollowing = following;
    requestAnimationFrame(tick);
  }

  // ---------------- init ----------------
  // Ensure CSS exists even if you forgot it:
  // (Won't override your file if you already have it.)
  if (!document.getElementById("__piggy_css_fallback__")) {
    const style = document.createElement("style");
    style.id = "__piggy_css_fallback__";
    style.textContent = `
      #piggy-overlay-root{position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none}
      #piggy-actor{position:fixed;left:60px;top:60px;width:120px;height:120px;transform:translate(-50%,-50%);will-change:left,top,transform;pointer-events:auto;cursor:pointer}
      #piggy-rig{width:100%;height:100%;transform-origin:50% 70%;
        transform:scale(var(--pig-scale,1)) scaleX(var(--pig-flip,1)) translateY(var(--pig-bob,0px)) rotate(var(--pig-tilt,0deg))}
      #piggy-svg{width:100%;height:100%;overflow:visible}
      .pig-bone{transform-box:fill-box;transform-origin:center}
      .pig-limb{transform-box:fill-box;transform-origin:50% 10%}
      .pig-face{transform-box:fill-box;transform-origin:center}
    `;
    document.documentElement.appendChild(style);
  }

  setFaceOpen();
  bones.sleepZs.style.opacity = "0";
  actor.style.left = `${pos.x}px`;
  actor.style.top = `${pos.y}px`;

  requestAnimationFrame(tick);

  window.addEventListener("resize", () => {
    nextBlinkAt = performance.now() + rand(CONFIG.blinkMinMs, CONFIG.blinkMaxMs);
  });
})();

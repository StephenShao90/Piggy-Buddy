// throw_feature.js
// Adds: right-click drag in any state, panic animation if awake,
// throw off-screen if fast swing toward border, opens fall.html window.

function initPigThrowFeature(opts) {
  const {
    actor,
    rig,
    getMode,
    removePig,
    setDraggingOverride
  } = opts;

  const CFG = {
    // Drag
    dragButton: 2, // right click
    clampToViewport: true,

    // Throw detection
    throwSpeedPxPerSec: 1250, // lower = easier throw, higher = harder
    throwZonePx: 60,          // must be within this distance of border
    outwardDotMin: 0.65,      // velocity must point "toward" that border

    // Panic visuals
    panicShakeDeg: 10,
    panicBobPx: 2.5,
    panicFreq: 22,

    // New window
    fallWindowName: "piggy-fall-window",
    fallWindowFeatures: "popup=yes,width=420,height=640"
  };

  // Prevent context menu while right-dragging
  let suppressContextMenu = false;
  actor.addEventListener("contextmenu", (e) => {
    if (suppressContextMenu) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  const pos = {
    // We'll read current position from actor style when drag starts,
    // and write back while dragging.
    x: 0,
    y: 0
  };

  const drag = {
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,

    // Velocity tracking
    lastT: 0,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,

    // Panic animation timebase
    panicT0: 0
  };

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function parsePx(s) {
    const n = Number(String(s || "").replace("px", ""));
    return Number.isFinite(n) ? n : 0;
  }

  function getViewport() {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function readActorCenter() {
    // actor.left/top are in px; actor transform translates -50% -50%.
    // We'll treat left/top as the "center point" already (matches your previous logic).
    const left = parsePx(actor.style.left);
    const top = parsePx(actor.style.top);
    return { x: left, y: top };
  }

  function writeActorCenter(x, y) {
    actor.style.left = `${x}px`;
    actor.style.top = `${y}px`;
  }

  function nearestBorderInfo(x, y) {
    const { w, h } = getViewport();

    const dLeft = x;
    const dRight = w - x;
    const dTop = y;
    const dBottom = h - y;

    // pick min distance
    let side = "left";
    let dist = dLeft;

    if (dRight < dist) { side = "right"; dist = dRight; }
    if (dTop < dist) { side = "top"; dist = dTop; }
    if (dBottom < dist) { side = "bottom"; dist = dBottom; }

    // compute an offset parameter along that side [0..1]
    let t = 0.5;
    if (side === "left" || side === "right") {
      t = clamp(y / Math.max(1, h), 0, 1);
    } else {
      t = clamp(x / Math.max(1, w), 0, 1);
    }

    // outward normal (direction you "throw" to leave screen)
    let nx = 0, ny = 0;
    if (side === "left") nx = -1;
    if (side === "right") nx = 1;
    if (side === "top") ny = -1;
    if (side === "bottom") ny = 1;

    return { side, dist, t, nx, ny, w, h };
  }

  function speed() {
    return Math.hypot(drag.vx, drag.vy);
  }

  function tryThrow() {
    const { x, y } = pos;
    const b = nearestBorderInfo(x, y);

    // Must be near border
    if (b.dist > CFG.throwZonePx) return false;

    // Must be moving fast enough
    const spd = speed();
    if (spd < CFG.throwSpeedPxPerSec) return false;

    // Must be moving outward to that border
    const vxn = drag.vx / Math.max(1e-6, spd);
    const vyn = drag.vy / Math.max(1e-6, spd);
    const outwardDot = vxn * b.nx + vyn * b.ny;
    if (outwardDot < CFG.outwardDotMin) return false;

    // THROW!
    doThrow(b.side, b.t);
    return true;
  }

  function doThrow(side, t) {
    // Stop dragging
    drag.active = false;
    suppressContextMenu = false;
    setDraggingOverride?.(false);

    // Remove pig from this page
    removePig?.();

    // Open fall window from same border
    // Works in extensions: chrome.runtime.getURL exists in content script
    let url = "fall.html";
    try {
      url = chrome.runtime.getURL("fall.html");
    } catch {}

    const u = new URL(url, window.location.href);
    u.searchParams.set("side", side);
    u.searchParams.set("t", String(t));

    // Open a small popup-like window
    window.open(u.toString(), CFG.fallWindowName, CFG.fallWindowFeatures);
  }

  function applyPanicAnimation(nowMs) {
    // Only panic if awake while being dragged
    if (getMode?.() !== "awake") {
      rig.style.setProperty("--pig-tilt", "0deg");
      rig.style.setProperty("--pig-bob", "0px");
      return;
    }

    const t = (nowMs - drag.panicT0) / 1000;
    const shake = Math.sin(t * CFG.panicFreq) * CFG.panicShakeDeg;
    const bob = Math.sin(t * (CFG.panicFreq * 0.7)) * CFG.panicBobPx;

    rig.style.setProperty("--pig-tilt", `${shake}deg`);
    rig.style.setProperty("--pig-bob", `${bob}px`);
  }

  actor.addEventListener("pointerdown", (e) => {
    if (e.button !== CFG.dragButton) return;

    suppressContextMenu = true;

    // start drag in ANY state
    e.preventDefault();
    e.stopPropagation();

    const c = readActorCenter();
    pos.x = c.x;
    pos.y = c.y;

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

    setDraggingOverride?.(true);

    try { actor.setPointerCapture(e.pointerId); } catch {}
  });

  actor.addEventListener("pointermove", (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    const now = performance.now();
    const dt = (now - drag.lastT) / 1000;

    const mx = e.clientX;
    const my = e.clientY;

    // Update velocity estimate (px/s)
    if (dt > 1e-4) {
      drag.vx = (mx - drag.lastX) / dt;
      drag.vy = (my - drag.lastY) / dt;
    }

    drag.lastT = now;
    drag.lastX = mx;
    drag.lastY = my;

    // Move pig to cursor offset
    let nx = mx + drag.offsetX;
    let ny = my + drag.offsetY;

    if (CFG.clampToViewport) {
      const { w, h } = getViewport();
      nx = clamp(nx, 20, w - 20);
      ny = clamp(ny, 20, h - 20);
    }

    pos.x = nx;
    pos.y = ny;
    writeActorCenter(nx, ny);

    // Panic if awake
    applyPanicAnimation(now);

    // Check for throw
    if (tryThrow()) return;
  }, { passive: false });

  actor.addEventListener("pointerup", (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId) return;

    drag.active = false;
    suppressContextMenu = false;
    setDraggingOverride?.(false);

    // Reset panic transforms if it was awake
    rig.style.setProperty("--pig-tilt", "0deg");
    rig.style.setProperty("--pig-bob", "0px");

    try { actor.releasePointerCapture(e.pointerId); } catch {}
  });

  actor.addEventListener("pointercancel", () => {
    drag.active = false;
    suppressContextMenu = false;
    setDraggingOverride?.(false);
    rig.style.setProperty("--pig-tilt", "0deg");
    rig.style.setProperty("--pig-bob", "0px");
  });
}

(() => {
  const nav = document.querySelector(".nav");
  const mores = document.querySelectorAll(".more");
  const toggle = document.querySelector(".menu-toggle");
  const mobile = document.querySelector(".mobile");
  const toTop = document.querySelector(".to-top");

  const onScroll = () => {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 12);
    if (toTop) toTop.classList.toggle("is-on", window.scrollY > 320);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && mobile) {
    toggle.addEventListener("click", () => {
      const open = mobile.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  mores.forEach((more) => {
    const btn = more.querySelector(".more-btn");
    btn?.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = more.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
      mores.forEach((other) => {
        if (other !== more) {
          other.classList.remove("is-open");
          other.querySelector(".more-btn")?.setAttribute("aria-expanded", "false");
        }
      });
    });
  });
  document.addEventListener("click", () => {
    mores.forEach((more) => {
      more.classList.remove("is-open");
      more.querySelector(".more-btn")?.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      mores.forEach((more) => {
        more.classList.remove("is-open");
        more.querySelector(".more-btn")?.setAttribute("aria-expanded", "false");
      });
    }
  });

  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  }

  document.querySelectorAll(".persona").forEach((p) => {
    const toggle = () => p.classList.toggle("is-alt");
    p.addEventListener("click", toggle);
    p.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    const chips = group.querySelectorAll("[data-filter]");
    const items = document.querySelectorAll("[data-pub-type]");
    const years = document.querySelectorAll("[data-year]");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("is-on"));
        chip.classList.add("is-on");
        const key = chip.getAttribute("data-filter");
        let shown = 0;
        items.forEach((item) => {
          const show = key === "all" || item.getAttribute("data-pub-type") === key;
          item.hidden = !show;
          item.classList.remove("pub-flash");
          if (show) {
            void item.offsetWidth;
            item.style.setProperty("--fd", `${Math.min(shown, 8) * 40}ms`);
            item.classList.add("pub-flash");
            shown += 1;
          }
        });
        years.forEach((block) => {
          const visible = [...block.querySelectorAll("[data-pub-type]")].some((el) => !el.hidden);
          block.hidden = !visible;
        });
      });
    });
  });

  const modal = document.querySelector("#featured-modal");
  if (modal) {
    const title = modal.querySelector("[data-modal-title]");
    const authors = modal.querySelector("[data-modal-authors]");
    const source = modal.querySelector("[data-modal-source]");
    const note = modal.querySelector("[data-modal-note]");
    const doi = modal.querySelector("[data-modal-doi]");
    const open = (btn) => {
      title.textContent = btn.dataset.title || "";
      authors.innerHTML = (btn.dataset.authors || "").replace(/H\.-X\. Zhong/g, "<b>H.-X. Zhong</b>");
      source.textContent = btn.dataset.source || "";
      note.hidden = btn.dataset.corresponding !== "true";
      if (btn.dataset.doi) {
        doi.hidden = false;
        doi.href = `https://doi.org/${btn.dataset.doi}`;
      } else {
        doi.hidden = true;
      }
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      overlayEntered();          // round 72: Back folds this before it leaves the page
    };
    const close = () => {
      const wasOpen = modal.classList.contains("is-open");
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      if (wasOpen) overlayLeft();
    };
    document.querySelectorAll("[data-featured]").forEach((btn) => btn.addEventListener("click", () => open(btn)));
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }
})();

/* ---- Shared overlay plumbing: one modal standard for the whole site ----
   inertOutside walks the overlay's ANCESTOR chain instead of sweeping
   document.body.children, because an overlay can sit inside <main> (the dot game
   lives inside the page body). A body-level sweep of a nested overlay silently
   leaves the whole page exposed. */
function inertOutside(root, on) {
  const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);
  let node = root;
  while (node && node !== document.body) {
    const parent = node.parentElement;
    if (!parent) break;
    parent.querySelectorAll(":scope > *").forEach((sib) => {
      if (sib === node || skip.has(sib.tagName)) return;
      if (on) sib.setAttribute("inert", "");
      else sib.removeAttribute("inert");
    });
    node = parent;
  }
}

/* Focus trap fallback for any environment without inert. */
function trapTab(root, event) {
  if (event.key !== "Tab") return;
  const focusables = Array.from(
    root.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
  ).filter((el) => !el.hidden && !el.disabled && el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

/* ---- The exit gesture the visitor already has (round 72) ----

   Every way out of a surface on this site is an in-page control: Esc, a close button, the curtain.
   A phone has no Esc and its visitor's habit is the system back gesture, so leaving that gesture
   alone made Back mean the one thing it must never mean while something is open: *leave the place*.
   Measured in a real browser (`.verify/_backprobe.mjs`): on rooms-toronto.html, press i, press Back,
   and the visitor is thrown back to street.html with the card folded and their position in the room
   gone. On a phone that is the whole of the site's exit contract failing, not a detail.

   So every surface that takes the screen (a card, the written lane, a story rail, the gallery plate,
   the dot game, the featured-publication modal) reports itself here. Opening one pushes one history
   entry; closing it pops the same entry. A Back that arrives while something is open folds that
   surface the way Esc would -- by dispatching the same Esc at it, so there is one fold path and not
   a second implementation that can drift -- and only a Back with nothing open leaves the place.

   The counters are `let` at module scope and the functions are declarations: the page's own IIFEs
   register listeners during the first run of this file and only call these later, on interaction. */
let overlayDepth = 0;        // surfaces this page has open and has a history entry for
let ownPop = 0;              // pops this page caused itself (the popstate after our own close)
let foldingFromHistory = false;

function overlayEntered() {
  overlayDepth++;
  try { history.pushState({ huaxuOverlay: overlayDepth }, ""); }
  catch (_) { overlayDepth = Math.max(0, overlayDepth - 1); }   // a file:// page may refuse
}

function overlayLeft() {
  if (foldingFromHistory || overlayDepth <= 0) return;
  overlayDepth--;
  ownPop++;
  try { history.back(); } catch (_) { ownPop = Math.max(0, ownPop - 1); }
}

/* What counts as "in the way of the picture", in the order they stack. Kept as one list because a
   surface that is missing here is a surface where Back still throws the visitor out. */
const OVERLAY_SURFACE = [
  "#room-plate.is-open",
  "[data-walk-game]:not([hidden])",
  "#featured-modal.is-open",
  "[data-dot-game]:not([hidden])",
  "[data-walk-card]:not([hidden])",
  "[data-walk-listpanel]:not(.is-closed)",
].join(", ");

window.addEventListener("popstate", () => {
  if (ownPop > 0) { ownPop--; return; }              // our own closes popping their entries
  if (overlayDepth <= 0) return;                     // nothing open: this Back is the exit, and it should leave
  overlayDepth--;
  const top = document.querySelector(OVERLAY_SURFACE);
  foldingFromHistory = true;
  try {
    if (top) top.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  } finally {
    foldingFromHistory = false;
  }
});

/* Enters an overlay: locks the page, isolates everything outside it, and moves
   focus in. The restore target is passed in by the caller rather than inferred
   from document.activeElement, which is not the clicked control in every
   environment. Falls back to the active element only when no caller knows. */
function enterOverlay(root, focusSel, trigger) {
  const restore = trigger || document.activeElement;
  document.body.style.overflow = "hidden";
  inertOutside(root, true);
  const target = focusSel ? root.querySelector(focusSel) : null;
  (target || root).focus();
  overlayEntered();
  return restore;
}

function leaveOverlay(root, trigger) {
  inertOutside(root, false);
  document.body.style.overflow = "";
  if (trigger && typeof trigger.focus === "function") trigger.focus();
  overlayLeft();
}

/* ---- Dot-trace game: thinking page nine-panel grid (owner decision 2026-09) ---- */
(function () {
  const game = document.querySelector("[data-dot-game]");
  if (!game) return;
  const board = game.querySelector("[data-dot-board]");
  const linesSvg = game.querySelector("[data-dot-lines]");
  const statusEl = game.querySelector("[data-dot-status]");
  const capEl = game.querySelector("[data-dot-cap]");
  const actEl = document.getElementById("dot-game-act");
  const titleEl = document.getElementById("dot-game-title");
  const watchBtn = game.querySelector("[data-dot-watch]");
  const revealBtn = game.querySelector("[data-dot-reveal]");
  const againBtn = game.querySelector("[data-dot-again]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SIZE = 5;
  const STEP_MS = 620;
  const PATH_LENGTH = { "Act I": 3, "Act II": 4, "Act III": 5 };
  let seq = [];
  let progress = 0;
  let phase = "idle"; // idle | watch | input | won
  let revealed = false;
  let lastFocus = null;
  let timers = [];
  const dots = [];

  const clearTimers = () => { timers.forEach((t) => clearTimeout(t)); timers = []; };
  const setStatus = (text) => { statusEl.textContent = text; };
  const center = (i) => ({ x: (i % SIZE) * 20 + 10, y: Math.floor(i / SIZE) * 20 + 10 });
  // Position is the dot's only identity. The visible number badge is ::after
  // content, which assistive tech does not reliably read, so the step order is
  // carried in the accessible name too; "Show me the path" is therefore the
  // screen-reader route into the game (design-detector audit 2026-09).
  const dotLabel = (i, step, total) => {
    const where = `row ${Math.floor(i / SIZE) + 1}, column ${(i % SIZE) + 1}`;
    return step ? `Step ${step} of ${total}, ${where}` : `Dot at ${where}`;
  };
  // Build the 5x5 dot field once.
  for (let i = 0; i < SIZE * SIZE; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot-cell-btn";
    b.dataset.dot = String(i);
    b.setAttribute("aria-label", dotLabel(i));
    b.innerHTML = '<span class="dot" aria-hidden="true"></span>';
    b.addEventListener("click", () => onTap(i));
    board.appendChild(b);
    dots.push(b);
  }

  const resetBoard = () => {
    dots.forEach((d, i) => {
      d.classList.remove("is-lit", "is-done", "is-wrong");
      d.removeAttribute("data-n");
      d.setAttribute("aria-label", dotLabel(i));
      d.disabled = false;
    });
    linesSvg.innerHTML = "";
    linesSvg.classList.remove("is-win");
  };

  const drawPath = (upto) => {
    linesSvg.innerHTML = "";
    if (upto < 0) return;
    const points = seq.slice(0, upto + 1).map((i) => { const p = center(i); return `${p.x},${p.y}`; }).join(" ");
    const pl = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    pl.setAttribute("points", points);
    linesSvg.appendChild(pl);
  };

  const newSequence = (k) => {
    const idx = Array.from({ length: SIZE * SIZE }, (_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, k);
  };

  const numberPath = () => {
    seq.forEach((di, n) => {
      dots[di].dataset.n = String(n + 1);
      dots[di].setAttribute("aria-label", dotLabel(di, n + 1, seq.length));
    });
  };

  const startInput = () => {
    phase = "input";
    progress = 0;
    dots.forEach((d) => { d.disabled = false; });
    setStatus("Your turn: tap the dots in the same order.");
  };

  const watch = () => {
    phase = "watch";
    clearTimers();
    resetBoard();
    dots.forEach((d) => { d.disabled = true; });
    setStatus("Watch the amber path…");
    if (reduceMotion) {
      seq.forEach((di) => dots[di].classList.add("is-lit"));
      if (revealed) numberPath();
      drawPath(seq.length - 1);
      timers.push(setTimeout(() => {
        seq.forEach((di) => dots[di].classList.remove("is-lit"));
        startInput();
      }, 1400));
      return;
    }
    seq.forEach((di, n) => {
      timers.push(setTimeout(() => {
        dots[di].classList.add("is-lit");
        if (revealed) dots[di].dataset.n = String(n + 1);
        drawPath(n);
      }, 350 + n * STEP_MS));
      timers.push(setTimeout(() => dots[di].classList.remove("is-lit"), 350 + n * STEP_MS + STEP_MS * 0.72));
    });
    timers.push(setTimeout(startInput, 350 + seq.length * STEP_MS + 250));
  };

  const win = () => {
    phase = "won";
    dots.forEach((d) => { d.disabled = true; });
    linesSvg.classList.add("is-win");
    setStatus("Traced. That reading is yours now:");
    capEl.hidden = false;
    againBtn.hidden = false;
    watchBtn.hidden = true;
    revealBtn.hidden = true;
  };

  const onTap = (i) => {
    if (phase !== "input") return;
    if (i === seq[progress]) {
      dots[i].classList.add("is-done");
      // Confirm the dot is spent without spoiling the order of the ones left.
      dots[i].setAttribute("aria-label", `${dots[i].getAttribute("aria-label")}, traced`);
      progress += 1;
      drawPath(progress - 1);
      if (progress >= seq.length) win();
      return;
    }
    const bad = dots[i];
    bad.classList.add("is-wrong");
    timers.push(setTimeout(() => bad.classList.remove("is-wrong"), 550));
    if (revealed) {
      setStatus("Not that one — the numbered path stays. Try again.");
      return;
    }
    setStatus("Not that one — watch the path once more.");
    timers.push(setTimeout(watch, 750));
  };

  const openGame = (btn) => {
    lastFocus = btn;
    const act = btn.dataset.act || "Act I";
    seq = newSequence(PATH_LENGTH[act] || 4);
    progress = 0;
    revealed = false;
    actEl.textContent = act;
    titleEl.textContent = `${btn.dataset.num} · ${btn.dataset.name}`;
    capEl.textContent = btn.dataset.cap;
    capEl.hidden = true;
    againBtn.hidden = true;
    watchBtn.hidden = false;
    revealBtn.hidden = false;
    game.hidden = false;
    lastFocus = enterOverlay(game, ".dot-game-close", lastFocus);
    watch();
  };

  const closeGame = () => {
    clearTimers();
    phase = "idle";
    resetBoard();
    game.hidden = true;
    leaveOverlay(game, lastFocus);
  };

  document.querySelectorAll("[data-dot-open]").forEach((btn) => {
    btn.addEventListener("click", () => openGame(btn));
  });
  watchBtn.addEventListener("click", () => { revealed = false; watch(); });
  revealBtn.addEventListener("click", () => {
    revealed = true;
    clearTimers();
    resetBoard();
    numberPath();
    drawPath(seq.length - 1);
    startInput();
    setStatus("The numbered path is shown — trace it from dot 1 to finish.");
  });
  againBtn.addEventListener("click", () => {
    seq = newSequence(seq.length);
    progress = 0;
    revealed = false;
    capEl.hidden = true;
    againBtn.hidden = true;
    watchBtn.hidden = false;
    revealBtn.hidden = false;
    linesSvg.classList.remove("is-win");
    watch();
  });
  game.querySelectorAll("[data-dot-close]").forEach((el) => el.addEventListener("click", closeGame));
  game.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeGame(); return; }
    trapTab(game, event);
  });
})();

/* ---- Districts: the walk (rooms page) ----
   The lane owns the viewport: entering a district should read as standing in a place, not looking at
   a figure set inside an article. Its level rail, accessible status and controls float over the view;
   W A S D, the touch stick, jump, turning and object use all share the same body and camera state.

   Deliberate limits, each one a trade rather than an oversight:
     - the body remains at eye height; the 3D camera and every authored surface use world coordinates,
       while horizontal input is projected into the view plane and collisions keep the body in its box
       — per-axis rejection against the walls, and against solids a contact-normal slide with
       push-out recovery, so a braced shoulder against a plinth lets the visitor walk past it (round
       41; the reject-only version pinned bodies at corners and sealed the wall aisles);
     - yaw is free and pitch is clamped to ±24°; turning is drag or keys (A/D, arrows) with double-click
       Pointer Lock as a desktop bonus — the space stays operable on phones, where drag is the whole
       control and Pointer Lock is unavailable;
     - world units are centimetres: eye at 168, walk at 165 cm/s, run at 206 cm/s, and a 420 cm/s
       jump impulse under 2400 cm/s² of gravity;
     - openings are authored by each place; Three.js depth testing handles occlusion, and Three.js
       IS the renderer (owner, 2026-10-20: "全站該是 3d js" — the Canvas2D lane painter that had been
       kept as a parallel path is deleted; a browser without WebGL gets the named sentence, not a
       second picture).
   This is not a lightmap, a physics engine or a claim that every detail is a survey. Sourced world
   records and authored props share a camera and depth buffer so a surface, its shadow and its hit target
   stay in the same place. */
(function () {
  const layer = document.querySelector("[data-walk]");
  if (!layer) return;
  const root = document.documentElement;
  const view = layer.querySelector("[data-walk-view]");
  /* Round 48 strict parity, kept single-path since round 54. The Three surface finishes every lit
     material with `enc(saturate(aces(in)))` — the filmic curve applied to the authored display values
     (the maps are NoColorSpace: nothing is linearised on either side) followed by the sRGB encode that
     `colorspace_fragment` performs. The pattern tiles that feed the lane are the one remaining place
     where colours become pixels here, so the same transform — matrix for matrix, exponent for exponent,
     from the vendored three's own shader — is applied once at their raster. Glow is outside it on both
     sides: the additive sprites are `toneMapped: false`, and a gradient is a glow. Instrumented
     contexts from the test harness (no initial fillStyle string) are left alone: the recorder measures
     authored colours, and rewriting them would rewrite the contract it checks. */
  const toneMirror = (ctx) => {
    if (!ctx || typeof ctx.fillStyle !== "string" || !ctx.fillStyle) return ctx;
    const e = 0.75 / 0.6;              // toneMappingExposure over the divisor the shader itself applies
    const fit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
    const aces = (r, gc, b) => {
      r *= e; gc *= e; b *= e;
      // mat3(v0, v1, v2) in GLSL multiplies COLUMN-wise: result.x = v0.x*r + v1.x*g + v2.x*b.
      // (A row-major reading passes any grey test and hue-shifts every colour — round 48 learned
      // that by turning the Niagara sky magenta in a screenshot.)
      let x = 0.59719 * r + 0.35458 * gc + 0.04823 * b;
      let y = 0.07600 * r + 0.90834 * gc + 0.01566 * b;
      let z = 0.02840 * r + 0.13383 * gc + 0.83777 * b;
      x = fit(x); y = fit(y); z = fit(z);
      r = 1.60475 * x - 0.53108 * y - 0.07367 * z;
      gc = -0.10208 * x + 1.10813 * y - 0.00605 * z;
      b = -0.00327 * x - 0.07276 * y + 1.07602 * z;
      const enc = (u) => { u = u < 0 ? 0 : u > 1 ? 1 : u;
        return u <= 0.0031308 ? u * 12.92 : 1.055 * (u ** (1 / 2.4)) - 0.055; };   // colorspace_fragment
      return [enc(r), enc(gc), enc(b)];
    };
    const HEX = /^(#)([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    const RGB = /^(rgba?\()\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(,[^)]*)?(\))$/;
    const map = (style) => {
      if (typeof style !== "string") return style;
      const m = HEX.exec(style);
      const rgb = m ? null : RGB.exec(style);
      try {
        if (m) {
          let h = m[2];
          if (h.length === 3 || h.length === 4) h = h.split("").map((ch) => ch + ch).join("");
          const alpha = h.length === 8 ? h.slice(6) : "";
          const r = parseInt(h.slice(0, 2), 16) / 255, gc = parseInt(h.slice(2, 4), 16) / 255,
                b = parseInt(h.slice(4, 6), 16) / 255;
          const o = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
          const t = aces(r, gc, b);
          return `#${o(t[0])}${o(t[1])}${o(t[2])}${alpha}`;
        }
        if (rgb) {
          const t = aces(+rgb[2] / 255, +rgb[3] / 255, +rgb[4] / 255);
          const c8 = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255);
          return `rgb${rgb[5] ? "a" : ""}(${c8(t[0])},${c8(t[1])},${c8(t[2])}${rgb[5] || ""})`;
        }
      } catch (e2) { /* an unparsable colour is somebody else's problem, and unchanged */ }
      return style;
    };
    // Shadow the prototype's accessors — and forward to them. An instance property that merely
    // stores the mapped colour never reaches the rasteriser, which is how the first version of this
    // mirror painted the fallback black: the canvas read its native fillStyle, still the default.
    const proto = Object.getPrototypeOf(ctx);
    for (const prop of ["fillStyle", "strokeStyle"]) {
      const native = Object.getOwnPropertyDescriptor(proto, prop);
      if (!native || !native.set) return ctx;
      Object.defineProperty(ctx, prop, {
        get() { return native.get.call(this); },
        set(v) { native.set.call(this, map(v)); },
        configurable: true,
      });
    }
    return ctx;
  };

  const statusEl = layer.querySelector("[data-walk-status]");
  const recordEl = layer.querySelector("[data-walk-record]");
  /* Round 55: a lane with no renderer has no picture, and until now the only trace of that was one
     sentence inside the info card — a visitor whose browser refuses WebGL saw an empty navy grid and
     nothing that said why. The panel takes the viewport's place, and it prints the one thing the
     picture was carrying that a reader still needs: where they are standing. That line is the status
     region's own text, mirrored — the lane's published state, never a re-derivation of it. */
  const offlineEl = layer.querySelector("[data-walk-offline]");
  const offlineWhere = layer.querySelector("[data-walk-offline-where]");
  const mirrorWhere = () => {
    if (!offlineEl || offlineEl.hidden || !offlineWhere || !statusEl) return;
    if (offlineWhere.textContent !== statusEl.textContent) offlineWhere.textContent = statusEl.textContent;
  };
  const noteOffline = () => {
    if (!offlineEl) return;
    offlineEl.hidden = false;
    // The prop buttons are a projection of quads onto a picture. With no picture they are cards
    // floating in an empty field — round 55's first no-WebGL frame showed two of them sitting on top
    // of the sentence explaining why nothing was drawn. The reach itself stays: facing something and
    // pressing E still opens its record, because that is geometry, not paint.
    layer.classList.add("is-offline");
    mirrorWhere();
  };
  const card = layer.querySelector("[data-walk-card]");
  const listPanel = layer.querySelector("[data-walk-listpanel]");
  const listBtn = layer.querySelector("[data-walk-list]");
  const pad = layer.querySelector("[data-walk-pad]");
  const stops = Array.from(layer.querySelectorAll("[data-walk-stop]"));
  const objs = Array.from(layer.querySelectorAll("[data-obj]"));
  // The chrome's way out and the curtain's destination are the same link, read once: the key, the finger
  // and the record must not be able to disagree about where leaving goes.
  const exitLink = layer.querySelector("[data-walk-exit]");
  const plate = document.getElementById("room-plate");
  const rows = Array.from(document.querySelectorAll(".frame-row[data-row-obj]"));
  const district = layer.dataset.walk;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = !reduce();   // one test, shared by the walk's motion and the rail's hold-to-pause

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const num = (el, prop) => parseFloat(el.style.getPropertyValue(prop)) || 0;
  const attr = (name, dflt) => parseFloat(layer.dataset[name]) || dflt;
  // Scene dimensions come from this room's record. The body radius is the only shared spatial
  // margin: a walker stays inside the actual wall faces, rather than inside one guessed room width.
  const WALL = attr("laneW", 640) / 2, CEIL = attr("laneCeil", 420);
  /* An open lane (round 32): a street with nothing over it -- Nakamise is open to the sky -- draws no
     lid, so what stands above the roofline (the pagoda over the west row) and the night sky itself
     are seen as they are, instead of behind a navy ceiling at the eaves. */
  const OPEN = attr("laneOpen", 0) ? true : false;
  /* The rest of the shell is the place's too (round 33). A tunnel has a vault and a concrete lid,
     not the street's sky; a pod has an acoustic-tile ceiling; a promenade has no wall behind you
     and no wall ahead -- the world goes on, and the walk limit is the only edge. Each is authored
     on the record's `lane` and stamped on the layer:
       `lid`       a PATS key or a #hex: what the ceiling is made of (absent: the street's sky);
       `vault`     cm of rise: the walls stop at CEIL - vault and the lid is a barrel over them;
       `open_back` / `open_end`: no wall at the mouth / at the far end. */
  const LID = layer.dataset.laneLid || "";
  const VAULT = Math.max(0, Math.min(attr("laneVault", 0), CEIL - 40));
  const WALL_TOP = CEIL - VAULT;
  const OPEN_BACK = attr("laneOpenBack", 0) ? true : false;
  const OPEN_END = attr("laneOpenEnd", 0) ? true : false;
  // `under`: the lane is underground (Journey's tunnel). Its walls, floor and vault are lit by its
  // own lamps whatever the hour outside, so they take neither the sun's lift nor the night's murk.
  const UNDER = attr("laneUnder", 0) ? true : false;
  // `wallmat`: what the shell's uncladded walls are made of -- the wall at your back, the end
  // wall round its window, any side panel no band covers. Absent: the street's plaster and concrete.
  const WALLMAT = layer.dataset.laneWallmat || "";
  const Z_FAR = attr("laneD", 1247), Z_BACK = -attr("laneBack", 240);
  const EYE = attr("eye", 168), PLAYER_RADIUS = 24, HEAD_CLEARANCE = 12;
  const HALF = Math.max(0, WALL - PLAYER_RADIUS);
  /* Round 52, for want of a better word, "blocks": the lane's width is a per-segment fact like its
     height — Clifton's plaza is not the promenade's walkway — authored as data-lane-ws
     [[z0, z1, half]…] in the same scene centimetres the walls draw in. The body gets the radius
     back off the half the same way the constant did. */
  const WSEGS = (() => {
    try { const a = JSON.parse(layer.getAttribute("data-lane-ws") || "[]");
          return Array.isArray(a) ? a.filter((w) => Array.isArray(w) && w.length >= 3) : []; }
    catch (_) { return []; }
  })();
  const halfAt = (z) => {
    let h = HALF;
    for (const w of WSEGS) if (z >= w[0] && z <= w[1]) h = Math.max(h, w[2] - PLAYER_RADIUS);
    return h;
  };
  /* Round 61: the paving is wider than the walk.
     `ws` is where a *body* may go, and round 58 pulled the square in to 17.5 m so a 64 m field
     would not read as a car park. The paving answered to the same number, so the square's own
     front row — the fronts at 16.4 m, the rails at 16.8, the wheel's apron at 19.3 — stood past
     the last paver, over nothing: from the plaza you could see the pavement end and the sky begin
     under the very shops that close the square. A street's paving runs to the buildings that line
     it; the walk stays where it was. Authored as data-lane-wsp [[z0, z1, half]…]. */
  const WPSEGS = (() => {
    try { const a = JSON.parse(layer.getAttribute("data-lane-wsp") || "[]");
          return Array.isArray(a) ? a.filter((w) => Array.isArray(w) && w.length >= 3) : []; }
    catch (_) { return []; }
  })();
  const pavedAt = (z) => {
    let h = HALF;
    for (const w of WPSEGS) if (z >= w[0] && z <= w[1]) h = Math.max(h, w[2]);
    return Math.max(h, halfAt(z));
  };
  const MIN_D = -30, REACH = 190, MAX_PITCH = 24;
  const MAX_HEIGHT = Math.max(0, CEIL - EYE - HEAD_CLEARANCE);
  /* Round 52 borrows two idioms from the browser open worlds the owner pointed at: the lane is
     allowed a *floor height* — the Falls Incline's upper deck stands 18 m over the Parkway and a
     body riding it must stand on that, not hover — and crossing a district boundary speaks a
     banner, which is what a visitor reads first in those games. `data-lane-floors` is
     [[z0, z1, h], …] in cm; `data-lane-zones` is [[z, "Name", "one line"], …] at the boundary. */
  const FLOORS = (() => {
    try { const a = JSON.parse(layer.getAttribute("data-lane-floors") || "[]");
          return Array.isArray(a) ? a.filter((f) => Array.isArray(f) && f.length >= 3) : []; }
    catch (_) { return []; }
  })();
  const floorAt = (z, x) => {
    let h = 0;
    for (const f of FLOORS) {
      if (z >= f[0] && z <= f[1] && (f.length < 4 || (x >= f[3] && x <= f[4]))) h = Math.max(h, f[2]);
    }
    return h;
  };
  /* Round 72 took the banner that read the lane's zone seams; round 76 took `data-lane-zones` itself,
     which had been left in the page for a reader that never came. The seams still reach a visitor as
     the rail's strip ticks, and the rail's `is-here` says where they are. */
  /* The funicular ride (round 52). GTA's F-key does one thing that matters: for a few seconds the
     vehicle carries you and the world carries on around it. Here the world is the real Falls
     Incline — 59.8 m of double track at 30 degrees, two 40-passenger cars counterbalanced so one
     is always meeting you — and the crossing it makes in 62 seconds the model compresses to 3.1,
     which the record line states while it is happening. */
  const RIDE_T = 3.1;
  const sm01 = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  let ride = null;
  /* Round 72, the owner's ruling: 「很多東西因為選取會跳這種介面…有必要的在跳」.

     There used to be a district banner here. It appeared by itself whenever the body crossed a zone
     seam, and again after every rail jump — so *selecting a stop* made an interface appear, which is
     the complaint word for word. The information it carried is not lost: the stop rail marks where
     you are (`is-here`) and the drawer names the district in its own card. Round 77 took the strip
     that this note used to cite as the third half: round 72 had cut its CSS in the same commit, so
     for five rounds the page carried three spans nobody could see. What is gone is a surface that
     appeared without being asked for, and the remains of one. */
  // How far the walker may go. The default is the end wall minus a body; the far plane is a view,
  // not a hole out of the world. A place whose far end is genuinely open authors its own walk limit.
  const MAX_D = attr("laneMaxD", Z_FAR - 47);
  // The smallest thing a hand can be asked to press. A far lantern may project to a few pixels of
  // wall; keep the ring on the silhouette and grow only the press area.
  const HIT = 44;
  // A slower, eased walk and a limited turn rate are deliberate comfort choices. Camera roll is
  // removed, and the remaining head bob is sub-centimetre so motion never fights the place being read.
  /* Round 71, the owner's correction: "moving left and right turns too far". Measured on the build
     before this change (`.verify/_turnprobe.mjs`, rooms-toronto, day): a TAP of D / A / the right
     arrow turned the head 7.4-9.2 degrees, a 200 ms press 37.7, a second 140.3, and a drag exactly
     0.09 deg/px. None of those is a look -- they are swings -- and the cause of the smallest one is
     that a tap was paid a whole 120 ms of turn because that is the frame clamp.

     So the two are separated, because they answer different questions:
       `TURN_RATE`  what a HELD key is worth, per second, to a visitor who is looking around;
       `TURN_TAP`   what a press too short for a frame is worth, and it is a nudge, not a step.
     Round 65 raised the held rate from 75 to 120 for the opposite complaint ("a right angle took a
     second and a quarter"); 85 keeps most of that gain and costs the overshoot. */
  const SPEED = 165, RUN = 1.25, TURN_RATE = 85;    // release decay tau is 90 ms, in stepMotion
  const TURN_TAP_MS = 35;            // ms of turn a tap is worth: 85 deg/s x 0.035 = 3.0 degrees
  const DRAG_DEG_PER_PX = 0.065;     // a drag sets the heading from distance; 100 px = 6.5 degrees
  const GRAV = 2400, JUMP = 420, GLIDE_SPEED = 165;
  /* Round 75: the glide's time and ceiling. 1.4 s is the wait this device already asks for a
     photograph's arrival; 7000 cm/s puts the longest authored jump (Goat Island's Terrapin
     Point, 155 m) at the same 1.4 s instead of 94. */
  const GLIDE_T = 1.4, GLIDE_SPEED_MAX = 7000;
  let zoom = 1, yaw = -4, pitch = -2, x = 0, depth = 60, height = 0, vy = 0;
  let vx = 0, vd = 0, phase = 0, bob = 0, raf = 0, last = 0, here = -1, reach = null;
  let tickMs = 0;
  let gliding = null, keys = new Set(), stick = null, down = null, hereFar = Infinity, hereShown = -1;
  /* Round 65: a press that no frame saw.

     The lane samples the keyboard once a frame, so on a slow machine a tap of D can begin and end
     between two frames -- and the head does not move at all. The visitor presses, nothing happens,
     they press again, and the lane reads as broken. That is not a machine being slow; it is the
     input being tied to the picture's clock, which is the one thing a control scheme must not be.

     So every press carries its own duration, and a press that no frame saw still moves the
     visitor: the tap is worth a floor of motion (a hundred and twenty milliseconds, which is one
     slow frame), applied once, in the direction the visitor pressed. A press a frame *did* see is
     not paid twice -- what is paid is only what that press still owes, and a long hold is
     therefore still just a long hold. */
  const tapState = new Map();   // key -> { ms, start, held }
  let wasDrag = false;   // the last gesture travelled, so the click it leaves behind is not a press
  const stopZ = stops.map((el) => num(el, "--z"));
  // Where across the lane a stop stands you (round 33): at the rail, not in the middle of a 14 m
  // terrace. Absent, a glide keeps the walker's own x, as it always did.
  const stopX = stops.map((el) => { const v = el.style.getPropertyValue("--x"); return v ? parseFloat(v) : undefined; });
  const stopView = stops.map((el) => {
    const view = (key) => {
      const v = parseFloat(el.dataset[`view${key}`]);
      return Number.isFinite(v) ? v : null;
    };
    return { yaw: view("Yaw"), pitch: view("Pitch"), h: view("H") };
  });

  /* ---- authored surfaces and the projection bridge ----
     This file remains the scene authoring and interaction layer: one camera defines walking, picking
     and the exact world-space polygons consumed by scene3d.js — Three.js is the renderer, whole (the
     Canvas2D picture this file used to also paint was retired by the owner on 2026-10-20; a browser
     without WebGL gets the named sentence in the info card, not a second rendering). Walls are split
     into 60 cm panels because an affine map is exact across a panel that narrow, and each carries
     the authored tiling material rather than a stock photograph. The quads compiled here are what the
     renderer draws and what the hit targets are measured against, so no interaction target can drift
     away from its surface; fog, the amber pool and the bulbs remain functions of the same
     projection. */
  const SEG = 60, NEAR = 24, DPM = 2;   // panel, near plane, pattern scale: the renderer's own
  let W = 0, H = 0, focal = 620, tilePat = null, floorPat = null, floorTiers = null, winPat = null,
      concretePat = null, galvPat = null;
  /* Two sizes, and they are not the same number (round 56).
     `W`/`H` are the DISPLAY size: every projection here — the hit boxes measured in CSS pixels, the
     HUD's stop rail, `camPt` — is written against them, so they stay what the layout says.
     `RW`/`RH` are the RENDER size: the WebGL backing store, which the stylesheet then stretches to
     the viewport. Until this round the two were the same, so a browser that rasterises in software
     (the owner's preview runs on SwiftShader) paid a full-viewport fragment bill per frame: measured
     4 fps at 1024×640 and 18 fps at 320×200 on the same street, with only 8 ms of JavaScript in the
     frame. The frame budget governor below trades resolution for motion, which is the trade a felt
     control scheme needs — the alternative it replaces was a picture that was sharp and unsteerable. */
  let RW = 0, RH = 0, renderScale = 1, frameMs = 0, frameBudgetAt = 0, frameSamples = 0;
  let renderMs = 0;                 // the picture's own cost, ms -- published for the harness
  let pumping = false;   // was the last frame driven by held input or motion? see tick()
  // One lookup for every cladding the walls and the ground can be wearing; a kind with no entry falls
  // back to the wall's own tiles, which is the honest default for a surface nobody specified.
  /* Tiles a page asks for by name. Most are painted at boot; round 33's place materials are lazy
     (`LAZY`): painted the first time something looks one up, so a page that never shows a carpet,
     a tunnel lining or a lit city never paints one -- and the boot's work stays the room's. */
  const LAZY = {};
  let PATKEY = null, FLATOF = {};
  const PATS = new Proxy({}, {
    get(t, k) {
      if (!(k in t) && typeof k === "string" && LAZY[k]) {
        t[k] = mkTile(LAZY[k]);
        if (PATKEY) PATKEY.set(t[k], k);
      }
      return t[k];
    },
  });
  const pics = new Map();
  const PIC_KEY = new WeakMap();
  const PATTERN_SOURCE = new WeakMap();
  let patternSerial = 0;
  const loadPics = () => {
    objs.forEach((el) => {
      const src = el.dataset.tex;
      if (!src || pics.has(src)) return;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      pics.set(src, img);
      PIC_KEY.set(img, src);
    });
  };
  const mkTile = (paint) => {
    const t = document.createElement("canvas");
    t.width = 128; t.height = 128;
    const c = t.getContext("2d");
    if (!c) return null;
    toneMirror(c);   // the tile is a lit surface in the 3D mode; it arrives tone-mapped the same once
    paint(c);
    // Round 54: the pattern used to be a CanvasPattern cut from the scene's own 2D context. Every
    // consumer only ever needed an identity that survives WeakMap/Map keying and points back at the
    // raster canvas — so the token stands alone now, and no second drawing context exists in this file.
    const token = { tile: t };
    PATTERN_SOURCE.set(token, { canvas: t, id: `tile-${++patternSerial}` });
    return token;
  };
  const paintWall = (c) => {
    c.fillStyle = "#465572"; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "rgba(20,30,50,.6)"; c.lineWidth = 2;
    for (let y = 0; y <= 128; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); }
    c.strokeStyle = "rgba(236,244,255,.16)"; c.lineWidth = 1;
    for (let y = 32; y <= 128; y += 32) {
      c.beginPath(); c.moveTo(0, y - 1); c.lineTo(128, y - 1); c.stroke();
      for (let k = 0; k < 4; k++) {
        const x0 = (k * 37 + (y / 32) * 19) % 128;
        c.beginPath(); c.moveTo(x0, y - 32); c.lineTo(x0, y); c.stroke();
      }
    }
    for (let i = 0; i < 220; i++) {
      c.fillStyle = `rgba(238,246,255,${((i % 5) * 0.013).toFixed(3)})`;
      c.fillRect((i * 53) % 128, (i * 29) % 128, 2, 2);
    }
    c.fillStyle = "rgba(16,24,42,.36)"; c.fillRect(0, 104, 128, 24);  // the damp line at the foot
  };
  /* Nakamise's paving (round 32): granite slabs laid square, "like a go board" (tour.ne.jp), two by
     two per tile in four close greys so the grid does not read as one stamp, with dark joints and
     a granite speckle. */
  const paintPaving = (c) => {
    ["#6f7178", "#686a72", "#73757c", "#6b6d74"].forEach((t, i) => {
      c.fillStyle = t; c.fillRect((i % 2) * 64, Math.floor(i / 2) * 64, 64, 64);
    });
    for (let i = 0; i < 260; i++) {
      c.fillStyle = `rgba(${i % 3 ? "230,232,238" : "20,22,28"},${(0.05 + (i % 5) * 0.012).toFixed(3)})`;
      c.fillRect((i * 37) % 128, (i * 71) % 128, 1 + (i % 2), 1);
    }
    c.strokeStyle = "rgba(18,20,26,.75)"; c.lineWidth = 2;
    [0, 64, 128].forEach((p) => {
      c.beginPath(); c.moveTo(p, 0); c.lineTo(p, 128); c.stroke();
      c.beginPath(); c.moveTo(0, p); c.lineTo(128, p); c.stroke();
    });
  };
  /* Round 33: the materials the Toronto-owned places are actually made of, each read off the
     photographs the records cite (TODO §0o). Tiles, because a photograph of somebody's real floor
     is the one lie this renderer tells for free.

     The LookOut's carpet: the 2017 window-wall photographs show a dark grey-brown loop carpet with
     a small repeating figure, not the street's asphalt or the steel the round-21 pod walked on. */
  const paintCarpet = (c) => {
    c.fillStyle = "#4b4741"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(22,20,18,0.30)";
    for (let y = 0; y < 128; y += 16) {
      for (let x = (y / 16) % 2 ? 8 : 0; x < 128; x += 16) c.fillRect(x, y, 8, 8);
    }
    for (let i = 0; i < 90; i++) {
      c.fillStyle = `rgba(${i % 3 ? "214,204,186" : "30,26,22"},${(0.06 + (i % 4) * 0.02).toFixed(2)})`;
      c.fillRect((i * 37) % 128, (i * 59) % 128, 2, 2);
    }
  };
  /* Its ceiling: square acoustic tiles in a light grid, the photographs' pale lid with the window
     head's dark soffit below it. One tile per 64 cm at the lid's own 2 px/cm, close to the 60 cm
     module such ceilings are hung in. */
  const paintAcoustic = (c) => {
    c.fillStyle = "#b4b1a9"; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 200; i++) {
      c.fillStyle = `rgba(70,68,62,${(0.10 + (i % 3) * 0.05).toFixed(2)})`;
      c.fillRect((i * 53) % 128, (i * 31) % 128, 1, 1);
    }
    c.fillStyle = "rgba(48,48,46,0.5)"; c.fillRect(0, 0, 128, 3); c.fillRect(0, 0, 3, 128);
  };
  /* The core's face: the pod's inner wall is the tower's own core, panelled and painted pale, with
     a joint every panel width. Nothing on it is a shop or a sign. */
  const paintCore = (c) => {
    c.fillStyle = "#8f8d88"; c.fillRect(0, 0, 128, 128);
    const grd = c.createLinearGradient(0, 0, 128, 0);
    grd.addColorStop(0, "rgba(255,255,255,0.07)"); grd.addColorStop(0.5, "rgba(255,255,255,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.07)");
    c.fillStyle = grd; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(34,34,36,0.42)"; c.fillRect(0, 0, 2, 128); c.fillRect(64, 0, 2, 128);
  };
  /* The window head: the photographs' dark soffit band over the glass, plain, one shadow line. */
  const paintSoffit = (c) => {
    c.fillStyle = "#2e323a"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, 0, 128, 64);
  };
  /* Journey's tunnel lining. Niagara Parks' own photograph of the passage is the source: the 1944
     bore is lined in concrete, rough and glistening, grey with dark wet blotches and the drips'
     vertical streaks -- not the bedrock strata the round-22 walls wore. */
  const paintTunnelC = (c) => {
    /* Round 35: the blotches were rectangles laid by arithmetic on their index (i * 47 % 128), and on
       the vault's facets at every distance they read as camouflage, not as wet concrete. The same
       material, drawn the way concrete is: a fine aggregate grain, a few soft wet patches with no
       corners, and the drips' streaks fading down the wall -- all from a seeded draw and wrapped at
       the tile's edges, so the 64 cm repeat does not print a grid down the bore. Same base, so the
       same mean within a point (the flat fallback stays #6e6f6c). */
    c.fillStyle = "#70716e"; c.fillRect(0, 0, 128, 128);
    let seed = 1944;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const wrap = (x, y, r, draw) => {
      for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) {
        if (x + dx + r < 0 || x + dx - r > 128 || y + dy + r < 0 || y + dy - r > 128) continue;
        draw(x + dx, y + dy);
      }
    };
    for (let i = 0; i < 16; i++) {
      const x = rnd() * 128, y = rnd() * 128, r = 8 + rnd() * 16, a = 0.04 + rnd() * 0.05;
      wrap(x, y, r, (px, py) => {
        const gr = c.createRadialGradient(px, py, 0, px, py, r);
        gr.addColorStop(0, `rgba(28,30,30,${a.toFixed(3)})`); gr.addColorStop(1, "rgba(28,30,30,0)");
        c.fillStyle = gr; c.fillRect(px - r, py - r, 2 * r, 2 * r);
      });
    }
    for (let i = 0; i < 14; i++) {
      const x = rnd() * 128, y = rnd() * 128, len = 30 + rnd() * 60, w = 1 + rnd() * 1.5, a = 0.05 + rnd() * 0.07;
      wrap(x, y + len / 2, len, (px, py) => {
        const gr = c.createLinearGradient(0, py - len / 2, 0, py + len / 2);
        gr.addColorStop(0, `rgba(22,24,24,${a.toFixed(3)})`); gr.addColorStop(1, "rgba(22,24,24,0)");
        c.fillStyle = gr; c.fillRect(px, py - len / 2, w, len);
      });
    }
    for (let i = 0; i < 700; i++) {
      const light = rnd() < 0.45, a = 0.04 + rnd() * 0.08;
      c.fillStyle = light ? `rgba(226,230,228,${a.toFixed(3)})` : `rgba(26,28,28,${a.toFixed(3)})`;
      c.fillRect(Math.floor(rnd() * 128), Math.floor(rnd() * 128), 1, 1);
    }
    for (let i = 0; i < 30; i++) {
      c.fillStyle = "rgba(232,238,238,0.10)";            // the wet glints under the lamps
      c.fillRect(Math.floor(rnd() * 128), Math.floor(rnd() * 128), 2, 1);
    }
  };
  /* Journey's walkway (round 35, the visitors' photographs of the tunnels): wet wooden boards laid
     along the passage, dark brown, the gaps between them black, and the wet's long sheen on every
     board. The floor maps a tile's width along the walk, so the boards are the tile's rows: four 16 cm
     boards to its 64 cm. No butt joints: one every 64 cm in every row read as parquet. Seeded. */
  const paintBoards = (c) => {
    c.fillStyle = "#4f4337"; c.fillRect(0, 0, 128, 128);
    let seed = 6650;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let r = 0; r < 4; r++) {
      const y = r * 32, t = rnd();
      c.fillStyle = t < 0.5 ? `rgba(24,18,12,${(0.06 + 0.12 * rnd()).toFixed(3)})`
                            : `rgba(150,128,104,${(0.05 + 0.1 * rnd()).toFixed(3)})`;
      c.fillRect(0, y + 2, 128, 29);
      for (let k = 0; k < 5; k++) {                     // the grain, the board's whole length
        c.fillStyle = `rgba(28,20,14,${(0.05 + 0.07 * rnd()).toFixed(3)})`;
        c.fillRect(0, y + 4 + Math.floor(rnd() * 24), 128, 1);
      }
      c.fillStyle = "rgba(226,222,212,0.10)";            // the wet sheen along the board
      c.fillRect(0, y + 8 + Math.floor(rnd() * 12), 128, 3);
      c.fillStyle = "rgba(12,10,8,0.85)"; c.fillRect(0, y, 128, 2);      // the gap
    }
  };
  /* The falling water's grain (round 35). A curtain was one flat colour with two moving bars on it,
     and at the deck's distance the bars read as windows in a pale wall. Water falling 57 m is ropes of
     solid water and white aerated streaks running the whole drop, so this tile is streaks that run its
     full height -- seamless down the sheet -- each brightening and fading along its length on whole
     periods of the tile, white where the water is broken and a darker blue-green between. It is an
     overlay, clear between the streaks, so the sheet's own colour shows through by day and the
     illumination's colour after dark. Seeded, like every scatter here: a curtain 600 m off aliases to
     grain, not to a lattice. */
  const paintFallsWater = (c) => {
    /* Falling water, drawn as the thing itself rather than as a veil over somebody else's stripes.

       Round 58 measured what this tile has to do: the sheet hangs 15-20 m from the rail, a visitor's
       frame is 1024 px over about 45 degrees, so one centimetre of water is under half a pixel. The
       old tile was 52 strands of one to three pixels with 10-40% alpha — at that distance it mips
       down to its own mean, which is exactly what a flat wash is. Water seen at fifteen metres is
       not fine grain: it is ropes twenty to ninety centimetres across, dark green between them and
       white where they break. So the tile carries a few wide ropes, the dark water that shows
       between them, and a little spray crossing all of it. */
    let seed = 35071;                                  // a fresh tile is clear: nothing to clear
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const band = (x, w, stops) => {
      const gr = c.createLinearGradient(x, 0, x + w, 0);
      stops.forEach(([t, col]) => gr.addColorStop(t, col));
      c.fillStyle = gr;
      c.fillRect(x, 0, w, 128);
      if (x + w > 128) c.fillRect(x - 128, 0, w, 128);
    };
    // The water between the ropes: green, and darker at the edges of every rope.
    c.fillStyle = "rgba(38,96,104,0.42)";
    c.fillRect(0, 0, 128, 128);
    // The ropes. Each is soft-edged (a gradient across its width) and fades in and out down its
    // length on whole periods of its own, so a scrolling tile never shows a seam.
    for (let i = 0; i < 9; i++) {
      const w = 10 + rnd() * 24, x = rnd() * 128, a = 0.30 + rnd() * 0.40;
      const per = 1 + Math.floor(rnd() * 2), ph = rnd() * Math.PI * 2;
      const gv = c.createLinearGradient(0, 0, 0, 128);
      for (let k = 0; k <= 10; k++) {
        const f = 0.45 + 0.55 * Math.sin(ph + (k / 10) * per * Math.PI * 2);
        gv.addColorStop(k / 10, `rgba(255,255,255,${(a * f).toFixed(3)})`);
      }
      c.save();
      c.beginPath(); c.rect(x - 1, 0, w + 2, 128); c.clip();
      c.fillStyle = gv; c.fillRect(x, 0, w, 128);
      c.restore();
      // the soft edge: the rope is densest down its middle
      band(x + w * 0.25, w * 0.5, [[0, "rgba(255,255,255,0)"], [0.5, `rgba(255,255,255,${(a * 0.55).toFixed(3)})`],
                                   [1, "rgba(255,255,255,0)"]]);
      if (x + w > 128) { c.fillStyle = gv; c.fillRect(x - 128, 0, w, 128); }
    }
    // The dark troughs: the water that stands between two ropes, which is what gives the curtain
    // its vertical grain instead of its blur.
    for (let i = 0; i < 7; i++) {
      const w = 3 + rnd() * 9, x = rnd() * 128, a = 0.12 + rnd() * 0.24;
      band(x, w, [[0, "rgba(22,62,74,0)"], [0.5, `rgba(22,62,74,${a.toFixed(3)})`], [1, "rgba(22,62,74,0)"]]);
    }
    // The spray crossing the whole curtain: short white dashes, the one part of a falls that has no
    // direction.
    for (let i = 0; i < 34; i++) {
      const x = rnd() * 128, y = rnd() * 128, w = 2 + rnd() * 7, h = 5 + rnd() * 18;
      c.fillStyle = `rgba(255,255,255,${(0.10 + rnd() * 0.22).toFixed(3)})`;
      c.fillRect(x, y, w, h);
      if (y + h > 128) c.fillRect(x, y - 128, w, h);
    }
  };
  /* The gorge wall (round 35): the rock at Table Rock stands in horizontal beds, pale grey-buff, as
     every photograph of the Canadian wall from below shows -- so a tile of beds of varying thickness
     and tone, with the odd vertical joint and a stain running down from it. Mapped down the face
     (`ax: "v"`), so the beds stay level from one face to the next. Seeded, like every scatter here. */
  const paintStrata = (c) => {
    c.fillStyle = "#8a8373"; c.fillRect(0, 0, 128, 128);
    let seed = 4211;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < 128;) {
      const h = 3 + Math.floor(rnd() * 9), t = rnd();
      c.fillStyle = t < 0.5 ? `rgba(40,36,30,${(0.05 + 0.12 * rnd()).toFixed(3)})`
                            : `rgba(236,230,214,${(0.04 + 0.1 * rnd()).toFixed(3)})`;
      c.fillRect(0, y, 128, Math.min(h, 128 - y));
      c.fillStyle = "rgba(34,30,26,0.22)"; c.fillRect(0, y, 128, 1);
      y += h;
    }
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(rnd() * 128), y = Math.floor(rnd() * 128), len = 10 + Math.floor(rnd() * 40);
      c.fillStyle = "rgba(30,28,24,0.28)";
      for (const dy of [-128, 0]) c.fillRect(x, y + dy, 1, len);
      const gr = c.createLinearGradient(0, y, 0, y + len * 1.6);
      gr.addColorStop(0, "rgba(46,40,34,0.12)"); gr.addColorStop(1, "rgba(46,40,34,0)");
      c.fillStyle = gr;
      for (const dy of [-128, 0]) c.fillRect(x - 3, y + dy, 7, len * 1.6);
    }
  };
  /* Table Rock Centre's walls (round 35): buff stone in courses, two storeys of tall dark windows,
     the lower ones arched -- the building in the Niagara Falls Tourism and Clifton Hill photographs
     (its 1926 north building is Collegiate Gothic, Wikipedia), not the grey box with a glass band it
     had been. One tile is the wall's full height, 9.5 m, so the windows sit on its floors. */
  const paintTrcWall = (c) => {
    c.fillStyle = "#a6977d"; c.fillRect(0, 0, 128, 128);
    let seed = 1926;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < 128; y += 6) {
      c.fillStyle = "rgba(70,60,46,0.22)"; c.fillRect(0, y, 128, 1);
      for (let x = (y / 6) % 2 ? 0 : 11; x < 128; x += 22) { c.fillRect(x, y, 1, 6); }
    }
    for (let i = 0; i < 90; i++) {
      c.fillStyle = rnd() < 0.5 ? "rgba(60,50,38,0.08)" : "rgba(240,230,210,0.08)";
      c.fillRect(Math.floor(rnd() * 128), Math.floor(rnd() * 128), 5, 3);
    }
    c.fillStyle = "#7c705e"; c.fillRect(0, 120, 128, 8);           // the base course
    c.fillStyle = "#8e816c"; c.fillRect(0, 60, 128, 4);            // the string course between floors
    const glass = (x, y, w, h, arch) => {
      c.fillStyle = "#2b333b";
      c.fillRect(x, y + (arch ? w / 2 : 0), w, h - (arch ? w / 2 : 0));
      if (arch) { c.beginPath(); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.fill(); }
      c.fillStyle = "rgba(170,190,205,0.18)"; c.fillRect(x + 1, y + h * 0.35, w - 2, h * 0.2);
      c.fillStyle = "rgba(20,22,24,0.9)";
      c.fillRect(x + w / 2 - 0.5, y + (arch ? w / 2 : 2), 1, h - (arch ? w / 2 : 2));
      c.fillRect(x, y + h * 0.62, w, 1);
    };
    glass(14, 72, 22, 46, true); glass(53, 72, 22, 46, true); glass(92, 72, 22, 46, true);
    glass(16, 18, 18, 34, false); glass(55, 18, 18, 34, false); glass(94, 18, 18, 34, false);
  };
  /* The Fallsview hotels by day (round 35): eight storeys of eight windows a tile, like the towers'
     night tile (`towerwin`), on a pale facade -- typical, as their footprints are (see the record's
     caveat): the list gives each one's height and floors, not its cladding. */
  const paintHotelDay = (c) => {
    c.fillStyle = "#b9b3a7"; c.fillRect(0, 0, 128, 128);
    let seed = 2009;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) {
      const v = rnd();
      c.fillStyle = v < 0.2 ? "#7f90a0" : v < 0.5 ? "#55667a" : "#475768";
      c.fillRect(k * 16 + 3, r * 16 + 4, 10, 8);
    }
    c.fillStyle = "rgba(60,58,54,0.25)";
    for (let r = 0; r <= 8; r++) c.fillRect(0, r * 16, 128, 1);
  };
  /* Woods seen from the side (round 35): crowns of trees in several greens, lit on top and shaded
     under, packed so no ground shows -- the bluff behind Table Rock and the edge of Goat Island's
     woods, which were flat green walls. Seeded crowns, wrapped at the tile's edges. */
  const paintCanopy = (c) => {
    c.fillStyle = "#34502e"; c.fillRect(0, 0, 128, 128);
    let seed = 3743;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 128, y = rnd() * 128, r = 6 + rnd() * 10, t = rnd();
      const col = t < 0.3 ? "58,86,48" : t < 0.65 ? "70,100,56" : t < 0.85 ? "46,70,40" : "86,112,62";
      for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) {
        const px = x + dx, py = y + dy;
        if (px + r < 0 || px - r > 128 || py + r < 0 || py - r > 128) continue;
        const gr = c.createRadialGradient(px - r * 0.3, py - r * 0.4, r * 0.1, px, py, r);
        gr.addColorStop(0, `rgba(${col},0.95)`); gr.addColorStop(0.7, `rgba(${col},0.8)`);
        gr.addColorStop(1, "rgba(30,44,26,0)");
        c.fillStyle = gr; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
      }
    }
  };
  /* The foam where the sheet lands (round 35): water churned white, with darker green-grey where
     it opens between the boils and paler streaks drawn out by the current. Opaque, like a ground
     tile -- it is laid on the basin only within some forty metres of the foot, the white beyond it
     thinning in plain translucent bands. Seeded and wrapped. */
  const paintFoam = (c) => {
    c.fillStyle = "#dfe9e6"; c.fillRect(0, 0, 128, 128);
    let seed = 5700;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const blob = (x, y, r, col) => {
      for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) {
        const px = x + dx, py = y + dy;
        if (px + r < 0 || px - r > 128 || py + r < 0 || py - r > 128) continue;
        const gr = c.createRadialGradient(px, py, 0, px, py, r);
        gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = gr; c.fillRect(px - r, py - r, 2 * r, 2 * r);
      }
    };
    for (let i = 0; i < 26; i++) blob(rnd() * 128, rnd() * 128, 6 + rnd() * 16, `rgba(96,140,134,${(0.2 + rnd() * 0.3).toFixed(3)})`);
    for (let i = 0; i < 30; i++) blob(rnd() * 128, rnd() * 128, 4 + rnd() * 10, `rgba(250,253,252,${(0.4 + rnd() * 0.4).toFixed(3)})`);
  };
  /* The upper river's rapids (round 35): above the Horseshoe the water runs fast and broken, white
     caps drawn out along the current over a blue-green that is the river's own (the flat colour it
     had, #4b8b8d, is the base). A ground tile, turned to the current by its prim's `rot`; seeded
     dashes, so the river kilometres off goes to grain, and used only on the near cells (the far
     ones keep the flat colour, which is this tile's mean). */
  const paintRapids = (c) => {
    c.fillStyle = "#408487"; c.fillRect(0, 0, 128, 128);
    let seed = 6650;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 44; i++) {
      const x = rnd() * 128, y = rnd() * 128, rx = 2 + rnd() * 5, k = 2.5 + rnd() * 3.5;
      const white = i % 4 !== 0, a = white ? 0.18 + rnd() * 0.34 : 0.1 + rnd() * 0.12;
      const col = white ? "236,246,244" : "22,60,66";
      for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) {
        if (Math.abs(x + dx - 64) > 64 + rx || Math.abs(y + dy - 64) > 64 + rx * k) continue;
        c.save(); c.translate(x + dx, y + dy); c.scale(1, k);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); gr.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = gr; c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
        c.restore();
      }
    }
  };
  /* The Table Rock parapet's stone: rough grey-brown blocks, the post the railing is set into in the
     photographs taken at the wall (Getty, May 2026). */
  /* The Table Rock parapet's stone (round 35, after the photographs at the brink): rough-faced grey
     limestone in irregular blocks, no two courses the same height, the joints dark and the faces
     weathered in patches -- not dressed ashlar, which is what the tile had been. Seeded. */
  const paintStoneWall = (c) => {
    c.fillStyle = "#67635b"; c.fillRect(0, 0, 128, 128);
    let seed = 7349;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const rows = [0, 34, 58, 96, 128];
    for (let r = 0; r < 4; r++) {
      const y0 = rows[r], y1 = rows[r + 1];
      let x = -Math.floor(rnd() * 30);
      while (x < 128) {
        const w = 26 + Math.floor(rnd() * 34), t = rnd();
        c.fillStyle = t < 0.45 ? `rgba(30,28,24,${(0.06 + 0.16 * rnd()).toFixed(3)})`
                               : `rgba(226,220,204,${(0.05 + 0.13 * rnd()).toFixed(3)})`;
        c.fillRect(x + 2, y0 + 2, w - 3, y1 - y0 - 3);
        // a rough face: a lit upper lip and a shadowed lower one on every block
        c.fillStyle = "rgba(236,230,216,0.10)"; c.fillRect(x + 2, y0 + 2, w - 3, 2);
        c.fillStyle = "rgba(20,18,16,0.16)"; c.fillRect(x + 2, y1 - 4, w - 3, 3);
        c.fillStyle = "rgba(24,22,19,0.6)"; c.fillRect(x, y0, 2, y1 - y0);
        if (x + w > 128) { c.fillStyle = "rgba(24,22,19,0.6)"; c.fillRect(x - 128, y0, 2, y1 - y0); }
        x += w;
      }
      c.fillStyle = "rgba(24,22,19,0.6)"; c.fillRect(0, y0, 128, 2);
    }
    for (let i = 0; i < 26; i++) {                      // weathering: dark and pale patches
      const px = rnd() * 128, py = rnd() * 128, r = 3 + rnd() * 9;
      c.fillStyle = rnd() < 0.6 ? `rgba(26,26,24,${(0.05 + 0.08 * rnd()).toFixed(3)})`
                                : `rgba(232,228,216,${(0.04 + 0.06 * rnd()).toFixed(3)})`;
      c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
    }
  };
  /* The ironwork between the parapet's posts (round 35, the same photographs): black flat bar, a rail
     top and bottom, an upright at every cell and a ring in each, a smaller ring turned inside it.
     Clear between the iron -- an overlay, like the falls' grain -- so the gorge stands behind it. One
     tile is one cell, square: the band is mapped a tile high. */
  const paintIronScroll = (c) => {
    c.fillStyle = "#18191c";
    c.fillRect(0, 0, 128, 11); c.fillRect(0, 117, 128, 11);   // the rails
    c.fillRect(0, 0, 8, 128);                                  // the upright at the cell's edge
    c.fillRect(64, 11, 7, 15); c.fillRect(64, 102, 7, 15);     // collars from the ring to the rails
    c.fillRect(8, 61, 20, 7); c.fillRect(107, 61, 21, 7);      // and to the uprights
    c.strokeStyle = "#18191c"; c.lineWidth = 7;
    c.beginPath(); c.arc(67.5, 64, 38, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 5;
    c.beginPath(); c.arc(67.5, 64, 19, Math.PI * 0.3, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(67.5, 64, 5, 0, Math.PI * 2); c.fill();
  };
  /* The Recreation Trail's paving stones (OSM: surface=paving_stones): small grey pavers in a
     running bond, a little uneven in tone. */
  /* Round 64: the joints are the paving's own drawing.

     They used to be 5-12% tints on a mid grey, drawn straight onto the base — enough to see at arm's
     length and gone by ten metres, which is why Clifton Hill's plaza was a pale sheet with a
     pattern in the file and none in the eye (measured: the ground sampled (143,161,178), a
     blue-grey with no structure in it at all). A pavement is a dark bed with stones laid on it, so
     the bed is now the dark colour and the stones sit on top of it, and the tile's mean is held
     where it was so the two distance tiers still meet without a step.

     And the stones are a paver's size: 48 cm square with a 3 cm joint, which on a 192 cm tile is
     four across. The old tile drew eight rows of 15 cm stones on a 64 cm period, and a 15 cm
     stone at a grazing angle is under a pixel — the mipmap ate the plaza's paving long before the
     eye lost it. The floor's own period says how big the tile is (FLOOR_PERIOD below). */
  const paintPavers = (c) => {
    c.fillStyle = "#2b2b27"; c.fillRect(0, 0, 128, 128);          // the joint bed
    for (let r = 0; r < 4; r++) {
      const off = r % 2 ? 16 : 0;
      for (let x = -off; x < 128; x += 32) {
        const v = (r * 7 + Math.round((x + 256) / 32)) % 5;        // no two stones are one colour
        c.fillStyle = `rgb(${97 + v * 3},${95 + v * 3},${87 + v * 3})`;
        c.fillRect(x + 1, r * 32 + 1, 30, 30);
      }
    }
  };
  /* The far tier of the floor is the same paving at twice the size: a 48 cm paver is a few pixels
     wide at twenty-six metres, and a paving whose stones have gone is a car park with rides
     parked in it. So the far tile is the same joint bed with twice the stones in it, and the same
     proportion of bed, so the two tiers carry the same mean and meet without a step. */
  const paintPaversCoarse = (c) => {
    c.fillStyle = "#2b2b27"; c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 2; r++) {
      const off = r % 2 ? 32 : 0;
      for (let x = -off; x < 128; x += 64) {
        const v = (r * 5 + Math.round((x + 256) / 64)) % 4;
        c.fillStyle = `rgb(${97 + v * 4},${95 + v * 4},${87 + v * 4})`;
        c.fillRect(x + 2, r * 64 + 2, 60, 60);
      }
    }
  };
  /* Round 64: the tile's world size belongs to the floor, not to the painter.

     The u v scale says how many centimetres one tile covers, and at the renderer's DPM 2 a tile
     is 64 cm -- the size of a trail's paving stones and a quarter of a plaza's paver. The paver
     tile above is drawn for 48 cm stones, so the floor that lays it down draws it three times
     larger: 192 cm to the tile, four pavers across. Without this the plaza's paving was half a
     paver wide at the size the canvas was drawn, and the mipmap averaged it away. */
  const FLOOR_PERIOD = { pavers: 3 };
  /* A lit city seen down from 346 m: a dark ground with a scatter of street lights and windows.
     The scatter is a texture and says so in the room's caveat -- the lights are drawn at a lit
     city's density, not surveyed street by street. */
  const paintCityNight = (c) => {
    c.fillStyle = "#1c2131"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(255,166,86,0.10)"; c.fillRect(0, 0, 128, 128);
    /* Scattered by a seeded generator, not by arithmetic on the index: the old (i * 83) % 128 laid
       the lights on a hidden lattice, and a lattice seen kilometres deep beats against the screen's
       own pixels in rippling arcs (round 33's frames from the LookOut). Scattered lights alias to
       grain, which is what a city at that distance looks like anyway. Same count, same colours. */
    let seed = 20171;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) {
      const warm = i % 4 !== 0;
      c.fillStyle = warm ? `rgba(255,${196 + (i % 4) * 12},${118 + (i % 3) * 32},${(0.6 + (i % 4) * 0.1).toFixed(2)})`
                         : "rgba(228,236,255,0.8)";
      const s = i % 6 === 0 ? 2 : 1;
      c.fillRect(Math.floor(rnd() * 128), Math.floor(rnd() * 128), s, s);
    }
  };
  /* The LookOut's towers wear their own window tile (round 34). The street's `paintWindows` lights a
     cell by arithmetic on its index, (8r + k) % 3, which puts the lit windows on diagonals: across a
     street that reads as a facade, but on a hundred towers seen from 346 m the diagonals ran face
     after face into hatching. Same grid (eight storeys of eight windows), same glass, the same 28 of
     64 lit in the same two colours -- so the same mean -- and which ones are lit is a seeded draw.
     A free draw clumps too (the first one stacked three warm windows in one column, a stripe of its
     own), so the seed is the first from 34117 whose draw keeps every row and column to two to five
     lit, no line of more than three lit windows in any direction, and the six warm ones in six
     different rows and columns. */
  const paintTowerWindows = (c) => {
    c.fillStyle = "#1b2740"; c.fillRect(0, 0, 128, 128);
    let seed = 86789;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cells = Array.from({ length: 64 }, (_, i) => i);
    for (let i = 63; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    cells.slice(0, 28).forEach((i, n) => {
      c.fillStyle = n < 6 ? "rgba(255,232,180,0.72)" : "rgba(206,226,255,0.5)";
      c.fillRect((i % 8) * 16 + 3, Math.floor(i / 8) * 16 + 4, 9, 7);
    });
    c.strokeStyle = "rgba(9,14,26,0.55)"; c.lineWidth = 1;
    for (let r = 0; r <= 8; r++) { c.beginPath(); c.moveTo(0, r * 16); c.lineTo(128, r * 16); c.stroke(); }
  };
  const paintFloor = (c) => {
    // Wet asphalt at night is a *reflective* surface, which is why it reads mid-tone and not black:
    // the joints and the sheen are what tell you it is under you.
    c.fillStyle = "#37435c"; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "rgba(14,20,34,.62)"; c.lineWidth = 2;
    c.strokeRect(-1, -1, 130, 130);
    c.strokeStyle = "rgba(214,230,255,.11)";
    c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 128); c.stroke();
    c.fillStyle = "rgba(206,226,255,.045)"; c.fillRect(0, 0, 128, 26);
    for (let i = 0; i < 150; i++) {
      c.fillStyle = `rgba(240,246,255,${((i % 4) * 0.014).toFixed(3)})`;
      c.fillRect((i * 71) % 128, (i * 43) % 128, 3, 2);
    }
  };
  const paintShutter = (c) => {
    // A rolling shutter is horizontal ribs plus a bottom rail and a padlock hasp: nothing else, and
    // specifically no shop name, because a name would be a claim about a shop that does not exist.
    c.fillStyle = "#4d5f5a"; c.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 8) {
      c.fillStyle = "rgba(10,18,30,0.5)"; c.fillRect(0, y + 6, 128, 2);
      c.fillStyle = "rgba(212,228,240,0.10)"; c.fillRect(0, y, 128, 1);
    }
    c.fillStyle = "#3c4a47"; c.fillRect(0, 96, 128, 32);
    c.fillStyle = "rgba(9,14,26,0.75)"; c.fillRect(56, 104, 16, 12);
    c.fillStyle = "rgba(226,236,246,0.5)"; c.fillRect(60, 108, 8, 3);
  };
  const paintDado = (c) => {
    c.fillStyle = "#3f5170"; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "rgba(12,20,36,0.55)"; c.lineWidth = 2;
    for (let y = 0; y <= 128; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); }
    for (let y = 0; y < 128; y += 32) {
      for (let k = 0; k < 4; k++) {
        const x = k * 32 + (y / 32 % 2 ? 16 : 0);
        c.strokeRect(x, y, 32, 32);
        c.fillStyle = "rgba(214,232,255,0.07)"; c.fillRect(x + 3, y + 3, 11, 4);   // the glaze line
      }
    }
  };
  /* Object materials, authored the way a model maker hand-paints a part: a 128 px tile of the
     stuff the thing is made of — curtain-wall glass, ribbed concrete, sawn wood, turf, the
     painted cabinet of a diorama table, water, ballast. The affine mapper tiles them across a
     face exactly as it tiles brick across a wall.
     The fill budget counts boot too, so each tile is painted in batched paths: many rect()s,
     one fill() per colour family. */
  const blob = (c, style, rects) => {
    c.fillStyle = style; c.beginPath();
    rects.forEach(([x, y, w, h]) => c.rect(x, y, w, h));
    c.fill();
  };
  /* The little city's towers at night. A tile is 128 px over 64 cm, so one cell is a 4 cm
     window -- twice life size at 1:87, which is the cheat every model tower makes, and at the
     distance this table is seen from it is two pixels of glow, which is what a window in a real
     skyline is. `v` scatters a different set of lit floors per variant. */
  /* The skyline, by day and by night.

     The night variant is a second texture rather than a warm wash laid over the day one, which is
     what it was and it was wrong: a flat tint over a varied window grid does not light the windows,
     it only removes the variation that made them read as windows. Measured, the city table fell
     from 466 colours to 34. The night has to be its own texture, with more floors lit and lit
     warmer, so the city gains detail when the light goes rather than losing it. */
  const paintSkyline = (v, nite) => (c) => {
    const cell = 8, n = 128 / cell;
    c.fillStyle = "#131c2e"; c.fillRect(0, 0, 128, 128);
    const on = nite ? 28 : 60, hot = nite ? 74 : 90, stir = nite ? 20 : 42;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const h = (x * 53 + y * 97 + x * y * 31 + v * 211) % 100;
      if (h > on) {                        // lit floors, warmer towards the top of the tile
        c.fillStyle = h > hot ? (nite ? "rgb(255,249,226)" : "rgb(255,242,208)")
                              : (nite ? "rgb(255,216,152)" : "rgb(255,203,132)");
        c.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 3);
      } else if (h > stir) {               // and the floors that are merely awake
        c.fillStyle = nite ? "rgba(150,174,210,0.55)" : "rgba(126,148,184,0.45)";
        c.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 3);
      }
    }
    c.strokeStyle = "rgba(8,12,24,0.55)"; c.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      c.beginPath(); c.moveTo(i * cell, 0); c.lineTo(i * cell, 128); c.stroke();
      c.beginPath(); c.moveTo(0, i * cell); c.lineTo(128, i * cell); c.stroke();
    }
  };
  const paintGlass = (c) => {
    // Solid glass at night: an opaque near-navy body, opaque pane variation, a few opaque lit
    // floors. Nothing on a tower is see-through; the old pale grid read as a veil.
    c.fillStyle = "#1d2b42"; c.fillRect(0, 0, 128, 128);
    const lit = [], dark = [];
    for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) {
      const cx = x / 16, cy = y / 16;
      // a non-linear hash, so the lit windows scatter like tenanted floors, not a diagonal
      if (((cx * 53 + cy * 97 + cx * cy * 31) % 89) < 12) lit.push([x + 1, y + 1, 14, 14]);
      else dark.push([x + 1, y + 1, 14, 14]);
    }
    blob(c, "rgb(38,54,84)", dark);
    blob(c, "rgb(242,196,124)", lit);
    c.strokeStyle = "rgb(10,16,30)"; c.lineWidth = 3;
    for (let v = 0; v <= 128; v += 16) {
      c.beginPath(); c.moveTo(v, 0); c.lineTo(v, 128); c.stroke();
      c.beginPath(); c.moveTo(0, v); c.lineTo(128, v); c.stroke();
    }
  };
  const paintTowerC = (c) => {
    c.fillStyle = "#98a1ab"; c.fillRect(0, 0, 128, 128);
    const hi = [], lo = [], sp = [];
    for (let x = 0; x < 128; x += 8) { hi.push([x, 0, 2, 128]); lo.push([x + 4, 0, 2, 128]); }
    for (let i = 0; i < 110; i++) sp.push([(i * 37) % 128, (i * 61) % 128, 2, 2]);
    blob(c, "rgba(255,255,255,0.12)", hi);
    blob(c, "rgba(28,38,58,0.20)", lo);
    blob(c, "rgba(58,70,92,0.06)", sp);
  };
  const paintWood = (c) => {
    c.fillStyle = "#77573a"; c.fillRect(0, 0, 128, 128);
    const seam = [], glaze = [], grain = [];
    for (let y = 0; y < 128; y += 21) {
      seam.push([0, y, 128, 3]); glaze.push([0, y + 4, 128, 2]);
      for (let x = 0; x < 128; x += 8) grain.push([x, y + 7, 4, 9]);
    }
    // Planks, not a wash: a crate seen head-on is one flat face, and the only thing that makes it
    // a crate rather than a brown rectangle is the boards it is made of.
    for (let y = 0; y < 128; y += 21) {
      c.fillStyle = (y / 21) % 2 ? "rgba(255,226,170,0.10)" : "rgba(30,18,8,0.16)";
      c.fillRect(0, y + 3, 128, 18);
    }
    blob(c, "rgba(20,10,4,0.85)", seam);
    blob(c, "rgba(255,226,164,0.16)", glaze);
    blob(c, "rgba(70,46,24,0.6)", grain);
  };
  /* Foliage for a billboard crown: clumps of flock, transparent between them, soft at the edge.
     A tree made of stacked boxes reads as a box whatever it is textured with, and a diorama tree is
     a pinch of flock on a wire -- which is a shape a repeating tile can carry and a box cannot. */
  const paintFoliage = (c) => {
    // No clear: mkTile hands in a canvas it has just made, so it is already empty. (It also keeps
    // this tile paintable under jsdom, whose 2d context has no clearRect.)
    const clumps = [[64,58,33],[43,47,23],[85,49,22],[54,37,21],[77,35,19],[64,73,23],
                    [39,66,17],[89,71,16],[64,45,25],[51,59,19],[79,61,18],[64,30,14]];
    for (const [cx, cy, r] of clumps) {
      const t = ((128 - cy) / 128) * 0.62 + (cx / 128) * 0.38;   // lit from above and to the right
      const R = Math.round(44 + t * 58), G = Math.round(72 + t * 70), B = Math.round(36 + t * 36);
      const g = c.createRadialGradient(cx - r * 0.32, cy - r * 0.36, r * 0.08, cx, cy, r);
      g.addColorStop(0, `rgb(${Math.min(255,R+20)},${Math.min(255,G+24)},${Math.min(255,B+14)})`);
      g.addColorStop(0.55, `rgb(${R},${G},${B})`);
      g.addColorStop(1, `rgba(${R>>1},${Math.round(G*0.55)},${B>>1},0)`);
      c.fillStyle = g;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    }
  };
  const paintTerrain = (c) => {
    c.fillStyle = "#4c6a3a"; c.fillRect(0, 0, 128, 128);
    const g0 = [], g1 = [], g2 = [];
    for (let i = 0; i < 300; i++) {
      const r = [(i * 53) % 128, (i * 29) % 128, 3, 3];
      (i % 3 === 0 ? g0 : i % 3 === 1 ? g1 : g2).push(r);
    }
    blob(c, "rgba(66,104,52,0.5)", g0);
    blob(c, "rgba(88,128,64,0.5)", g1);
    blob(c, "rgba(52,84,44,0.5)", g2);
  };
  const paintPedestal = (c) => {
    c.fillStyle = "#2a3242"; c.fillRect(0, 0, 128, 128);
    blob(c, "rgba(255,255,255,0.06)", [[0, 0, 128, 6]]);
    blob(c, "rgba(216,198,152,0.4)", [[0, 10, 128, 2]]);
    blob(c, "rgba(8,12,20,0.7)", [[0, 112, 128, 16]]);
    const sp = [];
    for (let i = 0; i < 40; i++) sp.push([(i * 71) % 128, (i * 37) % 128, 3, 2]);
    blob(c, "rgba(255,255,255,0.024)", sp);
  };
  const paintWater = (c) => {
    c.fillStyle = "#27496a"; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "rgba(208,232,248,0.14)"; c.lineWidth = 1;
    for (let y = 6; y < 128; y += 9) {
      c.beginPath();
      for (let x = 0; x <= 128; x += 8) {
        const yy = y + ((x / 8) % 2 ? 1.5 : -1.5);
        if (x) c.lineTo(x, yy); else c.moveTo(x, yy);
      }
      c.stroke();
    }
  };
  const paintTrack = (c) => {
    c.fillStyle = "#3a3f4a"; c.fillRect(0, 0, 128, 128);
    const ties = [];
    for (let x = 0; x < 128; x += 16) ties.push([x, 34, 4, 60]);
    blob(c, "rgba(14,17,24,0.6)", ties);
    blob(c, "rgba(206,216,230,0.55)", [[0, 40, 128, 2], [0, 86, 128, 2]]);
  };
  const paintCityG = (c) => {
    // Pale city ground: block lines and two park patches, the way a downtown base is painted.
    c.fillStyle = "#8d94a0"; c.fillRect(0, 0, 128, 128);
    const lines = [];
    for (let v = 0; v <= 128; v += 32) lines.push([v, 0, 1, 128], [0, v, 128, 1]);
    blob(c, "rgba(58,66,82,0.5)", lines);
    blob(c, "rgba(96,128,72,0.8)", [[8, 72, 24, 20], [96, 8, 22, 18]]);
    const sp = [];
    for (let i = 0; i < 60; i++) sp.push([(i * 61) % 128, (i * 41) % 128, 2, 2]);
    blob(c, "rgba(255,255,255,0.05)", sp);
  };
  const paintCobble = (c) => {
    c.fillStyle = "#6d6a62"; c.fillRect(0, 0, 128, 128);
    const st = [];
    for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) {
      st.push([x + 2 + (y / 16 % 2 ? 4 : 0), y + 2, 11, 11]);
    }
    blob(c, "rgba(122,118,108,0.9)", st);
    blob(c, "rgba(40,38,34,0.55)", [[0, 0, 128, 1], [0, 16, 128, 1], [0, 32, 128, 1], [0, 48, 128, 1],
                                    [0, 64, 128, 1], [0, 80, 128, 1], [0, 96, 128, 1], [0, 112, 128, 1]]);
  };
  const paintRock = (c) => {
    // Gorge stone: irregular chips, not boards — short dark breaks and lichen, no long lines.
    c.fillStyle = "#565a63"; c.fillRect(0, 0, 128, 128);
    const chip = [], litc = [], moss = [];
    for (let i = 0; i < 90; i++) {
      const x = (i * 47) % 128, y = (i * 71) % 128, w = 6 + (i % 3) * 5, h = 3 + (i % 2) * 2;
      (i % 2 ? chip : litc).push([x, y, w, h]);
    }
    for (let i = 0; i < 34; i++) moss.push([(i * 83) % 128, (i * 37) % 128, 4, 3]);
    blob(c, "rgba(34,36,44,0.45)", chip);
    blob(c, "rgba(148,152,162,0.35)", litc);
    blob(c, "rgba(84,110,64,0.45)", moss);
  };
  const paintSand = (c) => {
    c.fillStyle = "#b7a98c"; c.fillRect(0, 0, 128, 128);
    const sp = [];
    for (let i = 0; i < 90; i++) sp.push([(i * 53) % 128, (i * 37) % 128, 2, 1]);
    blob(c, "rgba(90,80,62,0.4)", sp);
    blob(c, "rgba(240,232,210,0.35)", [[0, 0, 128, 2]]);
  };
  const paintHallPlaster = (c) => {
    // A gallery wall is a quiet wall: warm grey, a trowel's whisper of noise, one faint shadow
    // line where the light gives up — no bricks, no pins, nothing to read at an angle.
    c.fillStyle = "#8e94a2"; c.fillRect(0, 0, 128, 128);
    const hi = [], lo = [];
    for (let i = 0; i < 130; i++) {
      const r = [(i * 53) % 128, (i * 29) % 128, 3, 2];
      (i % 2 ? hi : lo).push(r);
    }
    blob(c, "rgba(255,255,255,0.028)", hi);
    blob(c, "rgba(24,32,50,0.035)", lo);
    c.strokeStyle = "rgba(24,32,50,0.10)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, 96.5); c.lineTo(128, 96.5); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.03)"; c.fillRect(0, 0, 128, 10);
  };
  const paintHallBase = (c) => {
    // The hall's dado: a painted charcoal plinth, scuffed at the height a stretcher cart would.
    c.fillStyle = "#3a4150"; c.fillRect(0, 0, 128, 128);
    blob(c, "rgba(255,255,255,0.03)", [[0, 0, 128, 4]]);
    const scuff = [];
    for (let i = 0; i < 40; i++) scuff.push([(i * 67) % 128, 60 + (i * 13) % 40, 4, 2]);
    blob(c, "rgba(16,22,34,0.25)", scuff);
    c.fillStyle = "rgba(10,14,24,0.5)"; c.fillRect(0, 116, 128, 12);
  };
  const paintDomeP = (c) => {
    // Ribbed roof: bright panels with the joints between them cut in dark. The old version was a
    // pale field with hairlines on it, which is why the dome measured as a white blob.
    for (let y = 0; y < 128; y += 16) {
      c.fillStyle = (y / 16) % 2 ? "#8296ae" : "#a8b8ca";
      c.fillRect(0, y, 128, 14);
      c.fillStyle = "rgba(20,28,44,0.78)"; c.fillRect(0, y + 14, 128, 2);
    }
    c.strokeStyle = "rgba(24,32,50,0.5)"; c.lineWidth = 2;
    for (let x = 0; x <= 128; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 128); c.stroke(); }
  };
  const paintBrick = (c) => {
    c.fillStyle = "#4a4038"; c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) {
      const y = r * 16;
      for (let k = -1; k < 5; k++) {
        const x = k * 32 + (r % 2 ? 16 : 0);
        c.fillStyle = `rgb(${72 + (r * 7 + k * 11) % 18},${56 + (r * 5 + k * 7) % 14},${50 + (r * 3 + k) % 12})`;
        c.fillRect(x + 1, y + 1, 30, 14);
      }
    }
  };
  const paintCorrugated = (c) => {
    c.fillStyle = "#586474"; c.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 12) {
      c.fillStyle = "rgba(9,15,26,0.42)"; c.fillRect(x + 8, 0, 4, 128);
      c.fillStyle = "rgba(224,236,248,0.14)"; c.fillRect(x, 0, 3, 128);
    }
    c.fillStyle = "rgba(9,15,26,0.4)"; c.fillRect(0, 0, 128, 5); c.fillRect(0, 123, 128, 5);
  };
  const paintHoarding = (c) => {
    // Plywood over an opening, with the seam and the screw line: the most common wall a lane has.
    c.fillStyle = "#6b5a41"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(20,14,8,0.5)"; c.fillRect(62, 0, 4, 128);
    c.strokeStyle = "rgba(240,226,196,0.09)"; c.lineWidth = 1;
    for (let y = 8; y < 128; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); }
    c.fillStyle = "rgba(16,20,28,0.6)";
    for (const [sx, sy] of [[10, 12], [50, 12], [76, 12], [118, 12], [10, 116], [118, 116]]) c.fillRect(sx, sy, 3, 3);
  };
  const paintKerb = (c) => {
    // The face of a kerb is concrete, its lip catches whatever the lanterns are doing, and the stain
    // of the gutter runs along the bottom of it. Three lines, and it stops being a painted stripe.
    c.fillStyle = "#4e5b74"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(232,240,252,0.34)"; c.fillRect(0, 0, 128, 7);
    c.fillStyle = "rgba(9,15,28,0.5)"; c.fillRect(0, 108, 128, 20);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(12,20,34,${((i % 4) * 0.05 + 0.05).toFixed(2)})`;
      c.fillRect((i * 37) % 128, (i * 61) % 100 + 10, 3, 2);
    }
  };
  const paintTactile = (c) => {
    // The yellow guide path, its truncated domes in a grid: this is the detail that tells a pedestrian
    // lane is a *street* rather than a corridor, and it is the last thing an alley gets before it is
    // rendered as a floor plane.
    c.fillStyle = "#b08a2a"; c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 4; k++) {
        const x = k * 32 + 16, y = r * 32 + 16;
        c.fillStyle = "rgba(255,222,128,0.85)"; c.beginPath(); c.arc(x, y, 8, 0, 6.2832); c.fill();
        c.fillStyle = "rgba(96,72,18,0.55)"; c.beginPath(); c.arc(x + 2, y + 3, 6, 0, 6.2832); c.fill();
        c.fillStyle = "rgba(255,236,176,0.9)"; c.beginPath(); c.arc(x - 2, y - 3, 3, 0, 6.2832); c.fill();
      }
    }
    c.strokeStyle = "rgba(60,44,10,0.6)"; c.lineWidth = 2; c.strokeRect(1, 1, 126, 126);
  };
  const paintGrate = (c) => {
    c.fillStyle = "#242c3a"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "#0d1420";
    for (let x = 8; x < 128; x += 18) c.fillRect(x, 6, 8, 116);
    c.strokeStyle = "rgba(196,210,228,0.22)"; c.lineWidth = 3; c.strokeRect(2, 2, 124, 124);
  };
  const paintLantern = (c) => {
    // One tile is mapped across the whole body, so the tile's seam is the lantern's top and bottom: the
    // white rims are painted straddling row zero and land on both ends for free. The ribs are a period
    // of the tile rather than a count, which is what keeps them horizontal at every depth.
    c.fillStyle = "#b0402e"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(238,230,212,0.92)"; c.fillRect(0, 120, 128, 8); c.fillRect(0, 0, 128, 8);
    for (let y = 20; y < 120; y += 16) {
      c.fillStyle = "rgba(52,18,14,0.5)"; c.fillRect(0, y, 128, 2);
      c.fillStyle = "rgba(255,206,150,0.15)"; c.fillRect(0, y - 6, 128, 4);
    }
    c.fillStyle = "rgba(12,10,16,0.42)"; c.fillRect(0, 56, 128, 3);
  };
  const paintConcrete = (c) => {
    // Board-formed concrete: the lane's other structural voice. Four pours to the tile, the board
    // seams left in, and the tie holes the formwork left — plus the grout that ran out of them, which
    // is the detail that separates "concrete" from "grey".
    c.fillStyle = "#6b7380"; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) {
      const y = i * 32;
      c.fillStyle = i % 2 ? "rgba(255,255,255,0.030)" : "rgba(12,18,32,0.055)";
      c.fillRect(0, y, 128, 32);
      c.strokeStyle = "rgba(24,32,50,0.45)"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(128, y + 0.5); c.stroke();
      [26, 102].forEach((x) => {
        c.fillStyle = "rgba(18,24,40,0.5)";
        c.beginPath(); c.arc(x, y + 16, 3, 0, 6.2832); c.fill();
        c.fillStyle = "rgba(210,222,236,0.15)"; c.fillRect(x - 1, y + 19, 2, 8);
      });
    }
    for (let i = 0; i < 170; i++) {
      c.fillStyle = `rgba(232,240,252,${((i % 4) * 0.012).toFixed(3)})`;
      c.fillRect((i * 61) % 128, (i * 43) % 128, 2, 2);
    }
    c.fillStyle = "rgba(16,24,42,0.22)"; c.fillRect(0, 104, 128, 24);
  };
  const paintGalv = (c) => {
    // Sheet metal over a frame: seams every 32 cm of tile, rivets down each seam, and the cold sheen
    // that is the whole reason a galvanised wall reads as metal instead of as paint. It is the material
    // that answers corrugated board at close range: corrugated is a wall, this is a skin over one.
    c.fillStyle = "#79828f"; c.fillRect(0, 0, 128, 128);
    const grd = c.createLinearGradient(0, 0, 128, 0);
    grd.addColorStop(0, "rgba(255,255,255,0.10)");
    grd.addColorStop(0.5, "rgba(255,255,255,0)");
    grd.addColorStop(1, "rgba(10,16,30,0.12)");
    c.fillStyle = grd; c.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 32) {
      c.strokeStyle = "rgba(20,28,44,0.5)"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, 128); c.stroke();
      c.strokeStyle = "rgba(236,244,255,0.12)"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x + 3.5, 0); c.lineTo(x + 3.5, 128); c.stroke();
      for (let y = 8; y < 128; y += 24) {
        c.fillStyle = "rgba(30,40,58,0.4)";
        c.beginPath(); c.arc(x + 16, y, 2, 0, 6.2832); c.fill();
      }
    }
    c.fillStyle = "rgba(16,24,42,0.26)"; c.fillRect(0, 108, 128, 20);
  };
  const paintWindows = (c) => {
    // Windows are a pattern, like the tiles and the asphalt: a photographed facade would be the one
    // lie available for free here, because it would carry somebody's actual street. Which cells are
    // lit is arithmetic on the tile index, so a block is stable frame to frame and never flickers.
    c.fillStyle = "#1b2740"; c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) {
      for (let k = 0; k < 8; k++) {
        const i = r * 8 + k;
        if (i % 3 === 0 || i % 7 === 4) {
          c.fillStyle = i % 5 === 0 ? "rgba(255,232,180,0.72)" : "rgba(206,226,255,0.5)";
          c.fillRect(k * 16 + 3, r * 16 + 4, 9, 7);
        }
      }
    }
    c.strokeStyle = "rgba(9,14,26,0.55)"; c.lineWidth = 1;
    for (let r = 0; r <= 8; r++) { c.beginPath(); c.moveTo(0, r * 16); c.lineTo(128, r * 16); c.stroke(); }
  };
  loadPics();
  /* The render size follows the display size and the governor's scale, and nothing else reads it
     except the renderer call at the bottom of draw(). Everything the visitor can point at stays in
     display pixels, so trading resolution for frame rate can never move a hit box. */
  /* A governor with no floor of its own will happily draw a 112×70 lane and let the browser stretch
     it across the window — measured at 320×200 in round 56, and the upscale is mush. Past roughly
     360 physical pixels across, the fill rate saved is worth less than the legibility lost, so the
     floor rides the display rather than being one constant: a wide window keeps the 0.35 a software
     rasteriser needs, a small one is not allowed to go soft to save pixels nobody was paying for. */
  /* Round 65: the floor of the render scale is 0.26, not 0.35.

     The governor's own comment says the walk is "steerable" at 24 fps and that below it "the
     picture stops answering the keys" -- and the floor of 0.35 made that unreachable on a machine
     without a GPU: measured in the sandbox's own software rasteriser, a 360 x 270 picture cost
     353 ms a frame, which is three frames a second. The lane was playable in a picture and
     unusable in the hand, and the owner's "the controls are terrible" was this floor.

     A quarter scale is soft; three frames a second is worse. The scale only falls this far on a
     machine that cannot hold the line, and it climbs back the moment it can.

     The floor has two rules, and the second one is the old one: a window narrower than 360
     physical pixels keeps its own resolution -- there is nothing to save on a picture that small,
     and stretching a 260-pixel lane across a 360-pixel window is the smear the round-56 floor
     was invented to stop. A wider window may go down to a quarter, and the ramp between the two
     keeps the picture's width near 260 pixels, which is where the fill rate stops being the
     whole of the frame time. */
  const minRenderScale = () => (W <= 360 ? 1 : Math.max(0.26, 260 / Math.max(1, W)));
  /* `?render=full` pins the picture at full resolution and turns the governor off.

     The governor is right for a visitor and wrong for a photograph: a soft quarter-scale picture
     is the price of a walkable frame rate on a machine without a GPU, and a screenshot taken at
     that scale is not evidence of what the lane looks like. The knob is a URL parameter, so a
     frame can be taken at the size the lane is authored at, and a visitor who wants the sharp
     picture more than the smooth walk can have it the same way. */
  const FULL_RENDER = (() => {
    try { return new URLSearchParams(location.search).get("render") === "full"; } catch (e) { return false; }
  })();
  const applyRenderScale = () => {
    renderScale = FULL_RENDER ? 1 : clamp(renderScale, minRenderScale(), 1);
    RW = Math.max(1, Math.round(W * renderScale));
    RH = Math.max(1, Math.round(H * renderScale));
  };
  const size = () => {
    const cw = view.clientWidth || innerWidth, ch = view.clientHeight || innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.round(Math.min(1180, Math.max(320, cw * dpr)));
    H = Math.max(1, Math.round(W * (ch / Math.max(1, cw))));
    applyRenderScale();
    tilePat = mkTile(paintWall);
    floorPat = mkTile(({ pod: paintPodFloor, paving: paintPaving, carpet: paintCarpet,
                         pavers: paintPavers, tunnel: paintBoards })[layer.dataset.floor] || paintFloor);
    /* The pavers fade with distance (round 35). Their joints are 8 cm apart, and a joint 8 cm from the
       next is under two pixels high from about six metres out at eye height: past that the pattern
       stops being pavers and becomes the moire rings and fans the Table Rock frames were full of. This
       renderer has no mip, and a box-filtered one was tried and reverted on the towers (round 34) --
       but a paved floor is the case a mean is right for: what a walkway twenty metres off looks like
       is its average colour. So the floor has tiers: the tile, the tile pulled half and then four
       fifths of the way to its own measured mean, and the mean, by the slice's distance ahead. The
       mean is kept exactly at every tier, so the tiers meet without a step in tone.

       Round 64: the wash now pulls toward the tile's OWN mean, in the tile's own colour space.
       The old target was an authored (121,117,112), which the canvas's tone map lifts to about
       (205,201,193) before it is ever laid down -- so the far tier was being washed toward a
       colour 50 levels lighter than the paving it was washing, which is why the tiers measured
       (170,168,164) and (173,171,168) and the plaza had one flat tone from the kerb to the wheel.
       The wash is weaker too (0.18 and 0.45): the far paving should soften, not go. */
    floorTiers = layer.dataset.floor === "pavers"
      ? [[0.18, paintPavers], [0.45, paintPaversCoarse]]
        .map(([k, paint]) => mkTile((c) => { paint(c); c.fillStyle = `rgba(90,88,82,${k})`; c.fillRect(0, 0, 128, 128); }))
      : null;
    winPat = mkTile(paintWindows);
    PATS.shutter = mkTile(paintShutter);
    PATS.dado = mkTile(paintDado);
    PATS.brick = mkTile(paintBrick);
    PATS.glass = mkTile(paintGlass);
    PATS.towerc = mkTile(paintTowerC);
    PATS.wood = mkTile(paintWood);
    PATS.terrain = mkTile(paintTerrain);
    PATS.pedestal = mkTile(paintPedestal);
    PATS.water = mkTile(paintWater);
    /* The same water by day: the night tile is a deep blue with dark streaks, and a warm lift over it
       reads as mud, not harbour. A day tile is its own texture — pale, horizontally struck, with the
       glints a sun leaves on a surface — chosen per variant rather than tinted over the first, which
       is the rule the skyline already earned. */
    PATS.waterDay = mkTile((c) => {
      c.fillStyle = "#5d89ac"; c.fillRect(0, 0, 128, 128);
      c.fillStyle = "rgba(38,74,110,0.30)";
      for (let y = 4; y < 128; y += 16) c.fillRect(0, y, 128, 3);
      for (let y = 0; y < 128; y += 8) {
        c.fillStyle = `rgba(214,232,244,${(0.10 + ((y / 8) % 3) * 0.05).toFixed(2)})`;
        c.fillRect(0, y, 128, 2 + (y % 3));
      }
      c.fillStyle = "rgba(240,248,252,0.5)";
      for (let i = 0; i < 26; i++) c.fillRect((i * 37) % 128, (i * 53) % 128, 6 + (i % 3) * 3, 1);
    });
    /* The pod's own ground: dark steel panels with a hairline seam, a shade brighter
 where the spots stand over it. Concrete would put the street's pavement at 346 m. */
    function paintPodFloor(c) {
      c.fillStyle = "#1e2637"; c.fillRect(0, 0, 128, 128);
      c.fillStyle = "rgba(10,15,28,0.6)";
      c.fillRect(0, 0, 128, 2); c.fillRect(0, 64, 128, 2); c.fillRect(0, 0, 2, 128); c.fillRect(64, 0, 2, 128);
      c.fillStyle = "rgba(160,178,205,0.05)"; c.fillRect(4, 4, 60, 60);
    }
    PATS.podfloor = mkTile(paintPodFloor);
    PATS.track = mkTile(paintTrack);
    PATS.domep = mkTile(paintDomeP);
    PATS.sky0 = mkTile(paintSkyline(0, 0));
    PATS.sky1 = mkTile(paintSkyline(1, 0));
    PATS.sky2 = mkTile(paintSkyline(2, 0));
    PATS.skyn0 = mkTile(paintSkyline(0, 1));
    PATS.skyn1 = mkTile(paintSkyline(1, 1));
    PATS.skyn2 = mkTile(paintSkyline(2, 1));
    PATS.foliage = mkTile(paintFoliage);
    PATS.cityg = mkTile(paintCityG);
    PATS.cobble = mkTile(paintCobble);
    PATS.rock = mkTile(paintRock);
    PATS.sand = mkTile(paintSand);
    PATS.hallplaster = mkTile(paintHallPlaster);
    PATS.hallbase = mkTile(paintHallBase);
    PATS.corrugated = mkTile(paintCorrugated);
    PATS.hoarding = mkTile(paintHoarding);
    PATS.plaster = tilePat;
    PATS.tactile = mkTile(paintTactile);
    PATS.kerb = mkTile(paintKerb);
    PATS.grate = mkTile(paintGrate);
    PATS.lantern = mkTile(paintLantern);
    PATS.concrete = mkTile(paintConcrete);
    PATS.galv = mkTile(paintGalv);
    // Round 33's materials (see the painters) are lazy -- painted on first use, see `LAZY`.
    Object.assign(LAZY, { carpet: paintCarpet, acoustic: paintAcoustic, core: paintCore,
                          soffit: paintSoffit, tunnelc: paintTunnelC, stonewall: paintStoneWall,
                          pavers: paintPavers, cityn: paintCityNight, towerwin: paintTowerWindows,
                          fallsw: paintFallsWater, rapids: paintRapids, strata: paintStrata,
                          trcwall: paintTrcWall, hotelw: paintHotelDay, canopy: paintCanopy, foam: paintFoam,
                          ironscroll: paintIronScroll });
    PATS.win = winPat;
    // Locals as well as registry entries: the end wall's face and the parapet's coping are painted in
    // draw() by name, and reading them back off PATS there would be the drawing code doing a lookup for
    // a material it can see in this file.
    concretePat = PATS.concrete;
    galvPat = PATS.galv;
    // When a grazing angle makes the affine solve give up, a textured quad must not fall back to
    // the void's navy — it falls back to the flat colour of the stuff it is made of, and the wedge
    // a thin slice leaves reads as shade, not as a hole.
    PATKEY = new Map(Object.keys(PATS).map((k) => [PATS[k], k]));
    if (floorPat) PATKEY.set(floorPat, `floor-${layer.dataset.floor || "default"}`);
    (floorTiers || []).forEach((pat, i) => { if (pat) PATKEY.set(pat, `floor-tier-${i}`); });
    FLATOF = { wall: "#465572", floor: "#37435c", shutter: "#4d5f5a", dado: "#3f5170",
               brick: "#4a4038", glass: "#1d2b42", towerc: "#98a1ab", wood: "#77573a",
               terrain: "#4c6a3a", pedestal: "#2a3242", water: "#27496a", track: "#3a3f4a",
               domep: "#c8ccd2", cityg: "#8d94a0", cobble: "#6d6a62", rock: "#5d6068",
               sand: "#b7a98c", hallplaster: "#8e94a2", hallbase: "#3a4150",
               corrugated: "#5a6470", hoarding: "#4a5568", plaster: "#465572",
               tactile: "#4a5568", lantern: "#e8b06a", kerb: "#5a6470", grate: "#3a4150",
               concrete: "#6b7380", galv: "#79828f",
               carpet: "#4b4741", acoustic: "#b4b1a9", core: "#8d8b86", soffit: "#2e323a", tunnelc: "#6e6f6c",
               // cityn and win are their tiles' measured means (round 33): the fallback stands in for the
               // tile, and the city's had been its unlit ground alone, a third of the tile's brightness.
               // towerwin measures the same as win (round 34): same glass, same count, same colours.
               stonewall: "#5f5c55", pavers: "#797570", cityn: "#363136", win: "#263149",
               towerwin: "#263149",
               // fallsw is an overlay (clear between its streaks): its fallback is a light veil, not a
               // solid; rapids falls back to the river's flat colour, the tile's measured mean.
               fallsw: "rgba(240,246,246,0.16)", rapids: "#4b8b8d",
               // round 35's place tiles, each its measured mean
               strata: "#847d6e", trcwall: "#7d7566", hotelw: "#969795", canopy: "#3b5631", foam: "#c5cfcc",
               // the parapet's ironwork is an overlay too: its fallback is the tile's own coverage
               ironscroll: "rgba(10,10,12,0.385)" };
  };

  /* Two shapes of island live inside the hit layer, and they answer two different questions: a list
     (the lamps, the wires, the cladding bands, the ground's own kit) and a single object (the opening
     in the end wall, and the compound seen through it). Reading them both with `[0]` was a list
     operation applied to an object, so the vista and the whole backdrop — plaza, crossing, city,
     tower, mountain, sky — were `undefined` from the day they were authored: `undefined || null` is
     `null`, `if (vista)` was false, and the lane's far end has been a blank wall with an invented
     lamp on it. The compound is drawn now, and nothing about it changed but this. */
  const readIsland = (sel) => {
    const v = readAny(sel);
    return Array.isArray(v) ? v : [];
  };
  const readOne = (sel) => {
    const v = readAny(sel);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  };
  /* P2 (round 69): the biggest island no longer lives in the page. A place whose world data runs
     past 60 KB is emitted into js/places/<place>.js, and the marker here keeps the same attribute
     with `data-place` and no text — so every caller, every gate and every selector still asks the
     same question. The bytes arrive from a plain <script> tag placed before this file, which is
     why the read can stay synchronous: no fetch, no await, no build step, and no page that paints
     a walk before its world exists. */
  const readAny = (sel) => {
    const node = layer.querySelector(sel);
    if (!node) return null;
    const text = (node.textContent || "").trim();
    if (text) {
      try { return JSON.parse(text); } catch (err) { return null; }
    }
    const name = sel.replace(/^\[|\]$/g, "");
    const place = node.dataset && node.dataset.place;
    const store = place && window.__HX_PLACES && window.__HX_PLACES[place];
    return store && Object.prototype.hasOwnProperty.call(store, name) ? store[name] : null;
  };
  const jsonData = (v) => { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } };
  const meta = objs.map((el) => ({
    el, kind: el.dataset.kind || el.dataset.obj, leaf: el.dataset.leaf || null, top: el.dataset.top || null,
    awn: el.dataset.awn || null, noren: el.dataset.noren || null, fascia: el.dataset.fascia || null,
    // Round 32: what a real place needed that the street's kit never did -- a shop bay's mural ground
    // and posts, a skyline's named towers, a bascule's split, a harbour boat's run. Record data on
    // the element, like an awning colour, or the renderer never sees it (lane-prop section 7).
    mural: jsonData(el.dataset.mural), posts: el.dataset.posts || null,
    towers: jsonData(el.dataset.towers), leaves: parseFloat(el.dataset.leaves) || 0,
    // Round 36/39: context-block outlines on the port table, and the tower's local metre footprint.
    blocks: jsonData(el.dataset.blocks), footprint: jsonData(el.dataset.footprint),
    floors: parseFloat(el.dataset.floors) || 0,
    observation: parseFloat(el.dataset.observation) || 0,
    run: parseFloat(el.dataset.run) || 0,
    // A door the record says is a lift (round 33: the exits of the LookOut and the tunnel).
    lift: el.dataset.lift === "true",
    // `liton` is the phase at which this prop's own windows come up. The district lights its
    // buildings one after another, and without a per-prop moment they all came on together, which
    // is a switch and not a dusk.
    liton: parseFloat(el.dataset.liton) || 0,
    // Round 52's open-world kit: the SkyWheel's rim and axle sit in the record, not in invented
    // constants — and the funicular's period, deck height and phase belong to the page too.
    dia: parseFloat(el.dataset.dia) || 0, axle: parseFloat(el.dataset.axle) || 0,
    turn: parseFloat(el.dataset.turn) || 0, phase0: parseFloat(el.dataset.phase0) || 0,
    deck: parseFloat(el.dataset.deck) || 0, period: parseFloat(el.dataset.period) || 0,
    // Round 58: a falls authored as a brink rather than as a standing sheet, and a material tile a
    // slab can wear (a bluff face is rock, and rock at a card's flatness is a grey wall).
    drop: el.dataset.drop === "true", tile: el.dataset.tile || null,
    // Round 63: how many storeys of windows a block wears, and how many to a row
    win: parseFloat(el.dataset.win) || 0, wincol: parseFloat(el.dataset.wincol) || 0,
    ry: num(el, "data-ry") || parseFloat(el.dataset.ry || 0),
    w: parseFloat(el.dataset.w) || 100, h: parseFloat(el.dataset.h) || 140,
    d: parseFloat(el.dataset.d) || 12, x: num(el, "--x"), z: num(el, "--z"), y: num(el, "--y"),
    solid: el.dataset.solid === "true",
    // Round 65: a prop that is only scenery (a lamp, a bin, a rail) is drawn and walked past; it
    // is not a press target, it does not stop the walk, and it does not speak. A landmark is the
    // other end of the range: something far and large that the visitor is meant to look at, and
    // whose own marker says so.
    quiet: el.dataset.quiet === "1",
    landmark: el.dataset.landmark === "1",
    pic: el.dataset.tex ? pics.get(el.dataset.tex) : null, sx: 0, sy: 0, sw: 0, sh: 0, shown: false,
    // A prop with `data-states` can be done to; the count of stops is authored, and the index lives
    // here rather than in the scene graph so that the card, the light and the picture read one value.
    states: (() => {
      if (!el.dataset.states) return null;
      try { return JSON.parse(el.dataset.states); } catch (e) { return null; }
    })(), st: 0,
  }));
  // A walker's body is a circle in the floor plane. Expand each authored solid's oriented rectangle
  // by the same radius; resolution below is axis-separated, so the visitor can slide along a prop
  // instead of being stopped by a diagonal bump. Floor graphics, glass floors and stairs are not
  // solids: only the props the generator explicitly classifies as physical enter this list.
  const colliders = meta.filter((m) => m.solid).map((m) => {
    const a = (m.ry * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const hx = (m.w * Math.abs(c) + m.d * Math.abs(s)) / 2 + PLAYER_RADIUS;
    const hz = (m.w * Math.abs(s) + m.d * Math.abs(c)) / 2 + PLAYER_RADIUS;
    return { x: m.x, z: m.z, w: m.w, d: m.d, c, s,
             minX: m.x - hx, maxX: m.x + hx, minD: m.z - hz, maxD: m.z + hz };
  });
  /* Walls the lane draws are walls the body meets — the pointer-lock demo's rule (its `walls`
     array is the painted geometry itself, not a parallel hand-marked one). A world quad that
     stands on the walkable floor (base within a hand's width of it), rises past the knee-chest
     line, and runs inside the box becomes a zero-thickness strip collider; its top-and-sky
     siblings (canopies at y0 950, portals at y0 262, gorge faces below the deck) are excluded
     by the base test alone. Without this, `wall-probe` measured 786 free standing points inside
     the journey tunnel's own walls — a visitor walks through exactly what they see (round 45). */
  {
    const bdIsland = readAny("[data-walk-backdrop]");
    const world = (bdIsland && bdIsland.world) || null;
    for (const p of (world && world.prims) || []) {
      if (p.t !== "f" && p.t !== "x") continue;
      const pts = p.p || [];
      if (pts.length < 3 || pts.some((q) => !Array.isArray(q) || q.length < 3)) continue;
      const ys = pts.map((q) => q[1]);
      const base = Math.min(...ys), span = Math.max(...ys) - base;
      if (span < 130 || base < -20 || base > 120) continue;
      for (let i = 0; i < pts.length; i++) {
        // bottom edges only, clipped to the lane's own x span: a face's closing and top returns
        // run over the doorway, and an outside wall crossing the lane diagonally (the gorge's revetment
        // at the tunnel's mouth) must contribute only the stub the visitor can actually meet. The
        // full-length diagonal of the first cut sealed the journey lane at both ends — V2 caught it.
        const q0 = pts[i], q1 = pts[(i + 1) % pts.length];
        if (Math.abs(q0[1] - base) > 30 || Math.abs(q1[1] - base) > 30) continue;
        let a = [q0[0], q0[2]], b2 = [q1[0], q1[2]];
        if (Math.max(a[1], b2[1]) < MIN_D - 4 || Math.min(a[1], b2[1]) > MAX_D + 4) continue;
        if (a[0] < b2[0]) { const t = a; a = b2; b2 = t; }          // a is now the +x end
        const x0 = -WALL - 4, x1 = WALL + 4;
        if (a[0] > x1) { const t = (x1 - b2[0]) / (a[0] - b2[0] || 1); a = [x1, b2[1] + (a[1] - b2[1]) * t]; }
        if (b2[0] < x0) { const t = (x0 - a[0]) / (b2[0] - a[0] || 1); b2 = [x0, a[1] + (b2[1] - a[1]) * t]; }
        if (a[0] <= b2[0]) continue;                                 // the segment never enters the lane
        const len = Math.hypot(b2[0] - a[0], b2[1] - a[1]);
        if (len < 10 || len > WALL) continue;
        //  len > WALL is the cross-section tell: a floor wall may lean into the lane, but nothing
        //  real spans more than its half-width from inside the lane — the journey tunnel runs under
        //  the gorge rim, whose deck-side retaining walls project diagonally ACROSS the tunnel frame
        //  (10 m of "wall" over a 2.4 m lane); accepting them sealed the rail stops V2 just caught.
        const ang = Math.atan2(b2[1] - a[1], b2[0] - a[0]);         // segment heading in lane space
        const th = 6;                                                // 3 cm of relief each side of the face
        colliders.push({ x: (a[0] + b2[0]) / 2, z: (a[1] + b2[1]) / 2, w: len, d: th,
                         c: Math.cos(ang), s: Math.sin(ang) });
      }
    }
    for (const b of colliders) {                                   // broad-phase boxes, as per props
      const hx = (b.w * Math.abs(b.c) + b.d * Math.abs(b.s)) / 2 + PLAYER_RADIUS;
      const hz = (b.w * Math.abs(b.s) + b.d * Math.abs(b.c)) / 2 + PLAYER_RADIUS;
      b.minX = b.x - hx; b.maxX = b.x + hx; b.minD = b.z - hz; b.maxD = b.z + hz;
    }
  }
  // Use the distance from the body circle to the prop's rotated rectangle, rather than colliding
  // with its radius-expanded bounding *box*. The box clipped corners and made a visitor touching a
  // prop's front face unable to slide along it; a circle/OBB test preserves the real clearance.
  const collidesAt = (px, pz) => colliders.some((b) => {
    const dx = px - b.x, dz = pz - b.z;
    const localX = dx * b.c + dz * b.s, localD = -dx * b.s + dz * b.c;
    const outX = Math.max(Math.abs(localX) - b.w / 2, 0);
    const outD = Math.max(Math.abs(localD) - b.d / 2, 0);
    return outX * outX + outD * outD < PLAYER_RADIUS * PLAYER_RADIUS;
  });
  /* The push a body needs to leave a solid's surface: for every collider, the shortest vector from
     the body centre back out to the rectangle grown by the body radius, as the face normal and the
     overlap. Two contacts resolve deepest-first. This is the projection step every engineless walk
     sim in the field converges on (the three.js pointer-lock demo kills the velocity component into
     the face; the Octree-based ones push the position along `normal * depth`) — ours was reject-only,
     and `wall-probe` measured what that costs: a diagonal touch at a plinth's corner froze the body
     with legal movement left on both sides (6 FREE/WEDGE stalls on the Moji hall alone). */
  const pushAt = (px, pz) => {
    let best = null;
    const R = PLAYER_RADIUS;
    for (const b of colliders) {
      const dx = px - b.x, dz = pz - b.z;
      const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
      const qx = Math.max(-b.w / 2, Math.min(b.w / 2, lx));
      const qd = Math.max(-b.d / 2, Math.min(b.d / 2, ld));
      const ox = lx - qx, od = ld - qd;
      const dist2 = ox * ox + od * od;
      if (dist2 >= R * R) continue;
      let lnx, lnd, pen;
      if (dist2 > 1e-9) {
        const dist = Math.sqrt(dist2);
        lnx = ox / dist; lnd = od / dist; pen = R - dist;
      } else {
        const ex = b.w / 2 - Math.abs(lx), ed = b.d / 2 - Math.abs(ld);
        if (ex < ed) { lnx = lx >= 0 ? 1 : -1; lnd = 0; pen = R + ex; }
        else { lnx = 0; lnd = ld >= 0 ? 1 : -1; pen = R + ed; }
      }
      const wnx = lnx * b.c - lnd * b.s, wnz = lnx * b.s + lnd * b.c;
      if (!best || pen > best.p) best = { nx: wnx, nz: wnz, p: pen };
    }
    return best;
  };
  const wires = readIsland("[data-walk-wires]");
  const beams = readIsland("[data-walk-beams]");
  const vista = readOne("[data-walk-vista]");
  const bd = readOne("[data-walk-backdrop]");
  const surfaces = readIsland("[data-walk-surfaces]");
  const marks = readIsland("[data-walk-marks]");
  /* Walking out of a room lands you on the street at that room's own door, not at the mouth a
     whole street away: every room's exit link carries `#at-<room>`, and the renderer spawns
     beside the door it names, facing down the street at the other doors. The connection between
     rooms is then a place you stand — you see the next door ahead and walk to it — instead of a
     teleport to the top of the street. With no hash (the album, the nav) the spawn is the mouth,
     as it always was. */
  const atId = (location.hash.match(/^#at-([a-z0-9-]+)$/) || [])[1];
  if (atId) {
    const door = meta.find((o) => o.el.dataset.obj === "door-" + atId);
    if (door) {
      depth = clamp(door.z, MIN_D + 40, MAX_D - 20);
      yaw = 0; pitch = -2; x = 0;
    } else {
      // Owned spaces return to the prop that revealed them. If it sits on a solid plinth, find a
      // collision-free side of that plinth where the target is within reach and no closer prop would
      // steal the next interaction. A fixed "front" spawn can strand a visitor 2 m from a tower on a
      // broad model table, or put a tree between them. Wall-mounted props land inward from the wall.
      // Round 54: anchors name the object, and the object is its id — the old match read `kind`,
      // which was only the id wearing the painter's clothes.  Read the id off the record itself.
      const prop = meta.find((o) => o.el.dataset.obj === atId);
      if (prop) {
        const table = colliders.find((b) => prop.x >= b.minX && prop.x <= b.maxX
          && prop.z >= b.minD && prop.z <= b.maxD);
        if (table) {
          // Collider bounds already include PLAYER_RADIUS; this small extra gap is just steering slack.
          const pad = 4;
          const approaches = [
            { x: table.minX - pad, depth: prop.z },
            { x: table.maxX + pad, depth: prop.z },
            { x: prop.x, depth: table.minD - pad },
            { x: prop.x, depth: table.maxD + pad },
          ].map((p) => ({ x: clamp(p.x, -halfAt(depth), halfAt(depth)),
                          depth: clamp(p.depth, MIN_D, MAX_D) }))
            .filter((p) => !collidesAt(p.x, p.depth))
            .map((p) => {
              const dx = prop.x - p.x, dd = prop.z - p.depth;
              const distance = Math.hypot(dx, dd) || 1;
              const fx = dx / distance, fd = dd / distance;
              const blockedByCloserProp = meta.some((other) => {
                if (other === prop) return false;
                const ox = other.x - p.x, od = other.z - p.depth;
                const otherDistance = Math.hypot(ox, od);
                return otherDistance < Math.min(REACH, distance) - 0.5
                  && (ox * fx + od * fd) / otherDistance >= 0.35;
              });
              return { ...p, distance, clear: !blockedByCloserProp };
            });
          const approach = approaches.find((p) => p.distance < REACH && p.clear)
            || approaches.sort((a, b) => a.distance - b.distance)[0];
          if (approach) { x = approach.x; depth = approach.depth; }
          else { x = clamp(prop.x, -halfAt(depth), halfAt(depth)); depth = clamp(table.minD - pad, MIN_D, MAX_D); }
        } else if (Math.abs(prop.x) > halfAt(prop.z) - 42) {
          x = clamp(prop.x - Math.sign(prop.x) * 90, -halfAt(depth), halfAt(depth));
          depth = clamp(prop.z, MIN_D, MAX_D);
        } else {
          x = clamp(prop.x, -halfAt(depth), halfAt(depth));
          depth = clamp(prop.z - prop.d / 2 - PLAYER_RADIUS - 36, MIN_D, MAX_D);
        }
        yaw = Math.atan2(prop.x - x, prop.z - depth) * 180 / Math.PI;
        pitch = -2;
      }
    }
  }
  const cam = () => {
    const ry = (yaw * Math.PI) / 180, rp = (pitch * Math.PI) / 180;
    return { x, z: depth, eye: EYE + height + bob, sy: Math.sin(ry), cy: Math.cos(ry),
             sp: Math.sin(rp), cp: Math.cos(rp) };
  };
  const camPt = (C, px, py, pz) => {
    const dx = px - C.x, dz = pz - C.z;
    const ax = dx * C.cy - dz * C.sy, az = dx * C.sy + dz * C.cy, ay = C.eye - py;
    return { x: ax, y: ay * C.cp - az * C.sp, z: az * C.cp + ay * C.sp };
  };
  const clipNear = (pts) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const pin = p.z >= NEAR, qin = q.z >= NEAR;
      if (pin) out.push(p);
      if (pin !== qin) {
        const t = (NEAR - p.z) / (q.z - p.z);
        out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, z: NEAR,
                   u: p.u + (q.u - p.u) * t, v: p.v + (q.v - p.v) * t });
      }
    }
    return out;
  };
  const affine = (p, uv) => {                    // three uv->screen pairs define the map
    /* Which three. A panel's first three corners are a fine triangle, but a ground cell clipped to
       a shoreline, or a quad the near plane has cut, can open with three corners almost in a line,
       and a map fitted on a sliver paints a sliver: the fill missed most of its own clip and the
       sky showed through the ground at the harbour's edge (round 33, the LookOut). When the first
       triangle is thin, a wide one is found instead -- the polygon's longest span in uv and the
       corner farthest from it. A rectangle's first triangle is half its box, so panels keep theirs. */
    let i0 = 0, i1 = 1, i2 = 2;
    const n = p.length;
    if (n > 3) {
      const tri = (a, b, c) => Math.abs((uv[b][0] - uv[a][0]) * (uv[c][1] - uv[a][1]) -
                                        (uv[c][0] - uv[a][0]) * (uv[b][1] - uv[a][1]));
      let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
      for (let i = 0; i < n; i++) {
        u0 = Math.min(u0, uv[i][0]); u1 = Math.max(u1, uv[i][0]);
        v0 = Math.min(v0, uv[i][1]); v1 = Math.max(v1, uv[i][1]);
      }
      if (tri(0, 1, 2) < 0.25 * (u1 - u0) * (v1 - v0)) {
        const d2 = (a, b) => (uv[a][0] - uv[b][0]) ** 2 + (uv[a][1] - uv[b][1]) ** 2;
        let far = -1;
        for (let i = 1; i < n; i++) if (d2(i, 0) > far) { far = d2(i, 0); i1 = i; }
        far = -1;
        for (let i = 0; i < n; i++) if (d2(i, i1) > far) { far = d2(i, i1); i0 = i; }
        far = -1;
        for (let i = 0; i < n; i++) if (tri(i0, i1, i) > far) { far = tri(i0, i1, i); i2 = i; }
      }
    }
    const [a0, b0] = uv[i0], [a1, b1] = uv[i1], [a2, b2] = uv[i2];
    const x0 = W * 0.5 + (focal * p[i0].x) / p[i0].z, y0 = H * 0.5 + (focal * p[i0].y) / p[i0].z;
    const x1 = W * 0.5 + (focal * p[i1].x) / p[i1].z, y1 = H * 0.5 + (focal * p[i1].y) / p[i1].z;
    const x2 = W * 0.5 + (focal * p[i2].x) / p[i2].z, y2 = H * 0.5 + (focal * p[i2].y) / p[i2].z;
    const det = (a1 - a0) * (b2 - b0) - (a2 - a0) * (b1 - b0);
    if (Math.abs(det) < 1e-6) return null;
    const m11 = ((x1 - x0) * (b2 - b0) - (x2 - x0) * (b1 - b0)) / det;
    const m12 = ((x2 - x0) * (a1 - a0) - (x1 - x0) * (a2 - a0)) / det;
    const m21 = ((y1 - y0) * (b2 - b0) - (y2 - y0) * (b1 - b0)) / det;
    const m22 = ((y2 - y0) * (a1 - a0) - (y1 - y0) * (a2 - a0)) / det;
    return [m11, m21, m12, m22, x0 - m11 * a0 - m12 * b0, y0 - m21 * a0 - m22 * b0];
  };
  /* Round 56: the table in `skills/japan-place/references/japan-vocabulary.md` reads a vending
     machine by "the lit shelf of cans behind glass, and the **white** body". The tint had been the
     street's orange since round 2, which is a can-vending machine of no make in particular; the
     white is the object the sources describe, so the machine changed colour when its body did. */
  const PROP_TINT = { vending: "#e9eef4", noren: "#3d5c9a", shrine: "#8c4238",
                      utility: "#4c5a76", poster: "#33435f", frame: "#2c3a56",
                      ac: "#6d7a90", crate: "#7a6248", bin: "#3f5a4a", bollard: "#8a8676",
                      steps: "#565f74", pipe: "#5c6a80", awning: "#8a3f3a", sign: "#2b3a56",
                      drain: "#111a2c", booth: "#8b9ab0", bikes: "#39435a", planter: "#6e5540",
                      cones: "#c96a34", mailbox: "#9c3b33", signA: "#c8c2b2", banner: "#8f3a3a",
                      front: "#2c3a56", ledge: "#6b7890", pane: "#6f7d92", window: "#6f7d92",
                  mirror: "#8f9bb0", ladder: "#a98a5e", hydrant: "#b8443a", recycle: "#3f6d5a",
                  meter: "#5f6a78", camera: "#4a566a", door: "#33405c",
                  pole: "#5c6a80", barrel: "#6a5340", stool: "#4a3f36", lamp: "#4a566a",
                  curtain: "#24406b", stall: "#6e4f38",
                  bank: "#dfe8f2", bench: "#4a3f36", rack: "#6a6f78",
                  plinth: "#2b2733", tower: "#6b7a92", skyline: "#1c2740", dome: "#93a3b8",
                  falls: "#dfe9f2", pool: "#1d3a55", boat: "#e8eef4", island: "#65764e",
                  shopbay: "#b8392b", gate: "#b8392b",
                  // Round 33: a Table Rock parapet post, the Journey deck's parapet, a tunnel
                  // mouth's concrete reveal, and a trail lamp post.
                  parapet: "#6a655b", deckwall: "#77746c", portal: "#5a5b58", lamp: "#2a2c30",
                  // Blue Wing Moji is painted blue, and that is the whole reason people photograph
                  // it: a blue bascule against red brick and a dark harbour.
                  drawbridge: "#3f6ea8", ship: "#5a6472",
                  // Round 52: the Clifton strip. The wheel's steel is the ship's gray, the car's
                  // body is the hull white and its glass the cab slate, and the midway food stall
                  // shares the market stall's wood — no colour crosses from outside the palette.
                  wheel: "#75858b", incline: "#dce2df", foodstall: "#6e4f38",
                  // The Moji buildings, each in the material the photographs and place sources show:
                  // cream station, red customhouse, orange OSK brick, striped Dalian brick, and the
                  // Retro High Mart's light-grid-over-dark-glass facade (round 41: re-read against
                  // the sourced photograph; the gray of the flat colour is the concrete, not the glass).
                  stationfront: "#c4b68e", customhouse: "#a5492f", osakashosen: "#c46d38", dalianhall: "#a24b36",
                  retrohighmart: "#7d8583", massing: "#dedbd2" };
  /* Props are named `kind`, `kind-2`, `kind-left`, `kind-s1`… and the shape/tint tables were keyed
     by the *whole* id — so `front-a` was a flat plane while `front` was a painted recess, and whole
     families of props (banners, crates, snow banks, stall curtains) lost their bodies to a fallback.
     A prop's kind is therefore resolved: the exact name if the table knows it, else the longest
     table key the id starts with at a dash or the string's end, else the id itself (a plane). */
  const kindOf = (id) => {
    if (PROP_TINT[id] !== undefined || SHAPE[id] !== undefined) return id;
    let best = null;
    for (const k of Object.keys(SHAPE)) {
      if (id.startsWith(k) && (id.length === k.length || id[k.length] === "-")
          && (best === null || k.length > best.length)) best = k;
    }
    return best || id;
  };
  // How far a kind is a solid. A picture on a wall is a plane and must not be given a thickness it
  // cannot have; everything else in a lane has three visible faces or it is a decal, not an object.
  const SHAPE = { vending: "vending", shrine: "box", utility: "box", ac: "box", crate: "box",
                  booth: "glass", bikes: "bikes", planter: "planter", cones: "cones",
                  mailbox: "flap", signA: "aboard", banner: "cloth", front: "front", pane: "pane",
                  bin: "bin", bollard: "box", steps: "box", pipe: "box", awning: "box",
                  sign: "signboard", drain: "plate", noren: "cloth", poster: "plane", frame: "plane",
                  track: "track", tram: "tram", tree: "tree",
                  mirror: "mirror", ladder: "ladder", hydrant: "hydrant", recycle: "flap",
                  meter: "box", camera: "camera",
                  // A door draws itself now (see the `door` branch): recess, leaf, panels, handle,
                  // fanlight. It still needs its door-height `data-h` from the record — a plate is
                  // flat on the floor and fails the press-box floor.
                  door: "door",
                  bank: "bank", bench: "bench", rack: "rack",
                  // The little city's kit: a diorama table and the silhouettes a model city is
                  // known by. Each is its own branch below; without one the prop falls back to a
                  // plane, so a new shape that never shipped would show as a card, not a crash.
                  plinth: "plinth", tower: "tower", skyline: "skyline", dome: "dome",
                  falls: "falls", pool: "pool", boat: "boat", island: "island",
                  // The tower's own: a panel of floor you see 342 m down through. Its branch
                  // shipped in round 21 without this key, so for nine rounds it drew as a 4 cm card.
                  glassfloor: "glassfloor",
                  // Moji's kit: the drawbridge the district is known by, the ships it opens for, and
                  // the mapped Retro High Mart tower modeled separately at 1:25.
                  drawbridge: "drawbridge", ship: "ship", stationfront: "stationfront",
                  // The round-52 shapes: a turning observation wheel and a working funicular.
                  wheel: "wheel", incline: "incline",
                  // Round 58: the strip's second ride — the carousel, turning on the frame clock.
                  carousel: "carousel",
                  // Round 64: the shade over the queue — the plaza's east side was an apron with
                  // two rails on it and nothing overhead.
                  parasol: "parasol",
                  // Round 54 audit: two kinds the authored records had been using while the table
                  // never named them — every `board` was reaching the plane branch by accident,
                  // not by decision, and the midway stall fell through although a stall branch
                  // exists.  The boards keep the same render, now it is at least stated; the stall
                  // finally draws as the stall its record describes.
                  board: "plane", foodstall: "stall",
                  // Round 56: the street's own furniture, each given the painter its silhouette
                  // needs. `vending`, `bench`, `rack` and `bin` had been resolving to "box" since
                  // the shapes table was written -- the sizes were the object table's and the
                  // bodies were crates. verify-shapes now fails on a named shape with no branch,
                  // so a line here without a painter underneath it cannot ship.
                  customhouse: "customhouse", osakashosen: "osakashosen", dalianhall: "dalianhall",
                  retrohighmart: "retrohighmart",
                  // Round 36: the port table's context blocks, in the map's outlines.
                  massing: "massing",
                  // The market's hall: St. Lawrence Market South as it stands -- a brick hall under
                  // one arched roof, the 1845 block's three stone arches at its north end, and no
                  // cupola, which came down in the 1902 rebuild (round 32).
                  hall: "markethall",
                  // Nakamise's own (round 32): a bay of the 1925 shop rows, and Kaminarimon.
                  shopbay: "shopbay", gate: "gate",
                  // Round 33: posts and parapets are boxes of their own material; a tunnel's
                  // mouth is its reveal round an opening the wall's `open` band leaves.
                  parapet: "box", deckwall: "box", portal: "portal",
  // Round 65: a landmark draws no body at all -- the world already draws the falls -- and its
  // branch says so in one line, so the shape audit can tell a deliberate nothing from a default.
  landmark: "landmark" };
  // A few props are named for what they are, not for the kind that draws them; these are the aliases.
  Object.assign(SHAPE, { pole: "box", barrel: "box", stool: "box", lamp: "box",
                         // Round 58: a plain box and a post, named for what they are — the bridge
                         // gate's two uprights and its lintel are exactly that and nothing more.
                         box: "box", post: "box",
                         curtain: "cloth", stall: "stall", ledge: "plane",
                         // A shop is a front the record gave an awning: the id says shop, the
                         // painter is the retail one.
                         shop: "front",
                         // A lift is a door that parts in the middle: the door painter draws it
                         // without the panels, handle and fanlight that make a street door.
                         lift: "door" });
  const mix = (hex, k) => {    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    /* Round 61: a caller that passes a third argument is calling the wrong function, and the result
       used to be the literal string `rgb(NaN,NaN,NaN)` — an invalid colour that the renderer drew as
       white. One such call (the SkyWheel's steel) was the wheel's 26 rim and A-frame quads. Loud in
       development, harmless in production: fall back to the first colour and say so once. */
    if (k !== undefined && typeof k !== "number") {
      if (!mix.warned) { mix.warned = true; console.warn("mix() called with a non-numeric lift:", hex, k); }
      return hex;
    }
    const to = k >= 0 ? [255, 238, 208] : [10, 17, 40];
    const a = Math.abs(k);
    return `rgb(${c.map((v, i) => Math.round(v + (to[i] - v) * a)).join(",")})`;
  };
  /* Two authored colours, blended. `mix` can only push a colour toward warm white or the void's navy,
     which is enough for a shade and not enough for a sky: a sky that goes from a deep blue overhead to
     a pale one at the horizon is two colours at either end of a gradient, and the gradient is the
     sky. Returns hex, so a blend can be blended again (`blendHex(a, blendHex(b, c, t), u)`). */
  const blendHex = (a, b, t) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return "#" + pa.map((v, i) => {
      const x = Math.round(v + (pb[i] - v) * t);
      return (x < 16 ? "0" : "") + x.toString(16);
    }).join("");
  };
  const ZERO8 = [0, 0, 0, 0, 0, 0, 0, 0];
  const quads = [];
  let threeRenderer = null;
  let nanLogged = 0;   // TEMP
  const add = (C, corners, uv, mode, arg, img) => {
    const pts = corners.map((c, i) => {
      const o = camPt(C, c[0], c[1], c[2]);
      o.u = uv[i * 2]; o.v = uv[i * 2 + 1];
      return o;
    });
    const cp = clipNear(pts);
    if (cp.length < 3) return null;
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    cp.forEach((q) => {
      const sx = W * 0.5 + (focal * q.x) / q.z, sy = H * 0.5 + (focal * q.y) / q.z;
      bx0 = Math.min(bx0, sx); bx1 = Math.max(bx1, sx);
      by0 = Math.min(by0, sy); by1 = Math.max(by1, sy);
    });
    /* Bounds, never corners.

       A quad is visible when the area it covers reaches the viewport, and that is not the same claim
       as "one of its corners is on screen". The far plane was the case that first showed it — a sky
       covers the view by being larger than it, so every corner lands off-screen and the whole
       backdrop would vanish — and the near plane is the same failure with the sign flipped: stand
       deep in the lane and the floor under you, the walls beside you and the roof over you are each
       one panel wider than the screen, so *every* quad you are standing in the middle of used to be
       culled at once and the frame collapsed to its base plate. The corner test was a cheap
       conservative filter that was not conservative in the one direction that mattered, and the
       lane's own harness had recorded it as a black frame for months. Clip first, project once,
       and cull against the box the projected points occupy — a superset of what the corner test
       kept, so nothing that used to be drawn has stopped being drawn. */
    if (bx1 < -80 || bx0 > W + 80 || by1 < -80 || by0 > H + 80) return null;
    let z = 0; cp.forEach((q) => { z += q.z; });
    if (typeof arg === "string" && /NaN/.test(arg) && nanLogged < 3) { nanLogged++; console.warn("NANCOLOUR", arg, new Error().stack.split("\n").slice(1,5).join(" | ")); }
    const texture = mode === "pat" && arg ? PATTERN_SOURCE.get(arg) : null;
    const quad = { z: z / cp.length, pts: cp, world: corners.map((c) => [c[0], c[1], c[2]]),
                   uv: corners.map((_, i) => [Number(uv[i * 2]) || 0, Number(uv[i * 2 + 1]) || 0]),
                   mode, arg, img,
                   textureSource: texture && texture.canvas,
                   textureKey: texture && (PATKEY && PATKEY.get(arg) || texture.id),
                   imageKey: img && PIC_KEY.get(img),
                   fallback: mode === "pat" && PATKEY ? (FLATOF[PATKEY.get(arg)] || "#2b3a56") : null,
                   // Kept so the night can skip quads too small for it to matter: darkening a
                   // 4-pixel speck costs a fill and changes nothing anyone can see.
                   area: (bx1 - bx0) * (by1 - by0) };
    quads.push(quad);
    return quad;
  };
  const facesOf = (m) => {
      const along = Math.abs(m.ry) > 45;                 // wall-mounted: its width runs down the lane
      const hx = (along ? m.d : m.w) / 2, hz = (along ? m.w : m.d) / 2;
      const x0 = m.x - hx, x1 = m.x + hx, z0 = m.z - hz, z1 = m.z + hz;
      const y0 = m.y, y1 = m.y + m.h;
      return [
        { n: [1, 0, 0], k: -0.2, p: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] },
        { n: [-1, 0, 0], k: -0.2, p: [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]] },
        { n: [0, 0, 1], k: 0.02, p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
        { n: [0, 0, -1], k: 0.06, p: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]] },
        { n: [0, 1, 0], k: 0.24, p: [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]] },
      ];
    };

  /* ---- the model kit (round 36) ----
     The owner looked at Moji Port on its one table and said the models had to come apart: at 1.5 cm to
     the metre every building on it was a block the size of a shoe. The four historic buildings now
     stand on their own stands at 1:25, and the Retro High Mart joins them at that scale on a lower
     base so it fits the hall. At that size a box with a picture on one face reads as a box. A model
     seen from two metres has to be built -- walls cut into bays, roofs as roofs, towers as towers --
     and this kit is what the five painters build with.

     It works in the model's own frame: u along its front (to the right of someone facing it), v out of
     its front, y up from its base, all in metres of the real building. `k` is the record's width over
     the building's real length, so the record keeps the scale and the painter keeps the proportions the
     sources give. Every point goes through P(), so a model can stand turned on its stand (`ry`) and all
     of it turns -- the table painters drew their fronts on whichever face looked down the lane.

     Sorting is what a painter's algorithm makes you design for. A wall is cut into bays and a window
     sorts just in front of the bay it is on, never by its own depth: a long front sorted at its middle
     hides the windows at its far end (round 35's tunnel pipe, met again on a facade). A part that
     stands through another -- a tower through a roof -- is told to paint late (`d` < 0). */
  const Z64 = new Array(64).fill(0);
  // Built models stand on stands that are lit for them; the generic contact shadow, an unrotated box
  // under the prop's middle, would lie across a turned model's walls, so their painters omit it.
  const MODEL_KINDS = new Set(["stationfront", "customhouse", "osakashosen", "dalianhall", "retrohighmart", "massing"]);
  const KEY_L = (() => { const v = [0, 0.85, -0.5], l = Math.hypot(v[0], v[1], v[2]); return v.map((c) => c / l); })();
  const modelKit = (C, m, drawn, lit, LEN) => {
    const k = m.w / LEN;
    /* Detail by what the eye can resolve: `ppm` is how many screen pixels one metre of the building
       makes from where the visitor stands. A glazing bar under a pixel wide, a band under one, a
       window under two are not drawn -- from the door the far models are a few hundred pixels across
       and their bars would only cost fills (the hall measured 6347 fills a frame with them, against
       1319 for the old table and 2707 for the busiest other page). */
    const dist = Math.hypot(C.x - m.x, C.eye - (m.y + m.h / 2), C.z - m.z) || 1;
    const ppm = (focal * k) / dist, seen = (metres, px = 0.8) => metres * ppm >= px;
    const a = ((m.ry || 0) * Math.PI) / 180;
    const ux = Math.cos(a), uz = Math.sin(a), nx = Math.sin(a), nz = -Math.cos(a);
    const P = (u, v, y) => [m.x + (ux * u + nx * v) * k, m.y + y * k, m.z + (uz * u + nz * v) * k];
    const Nw = (du, dv) => [ux * du + nx * dv, 0, uz * du + nz * dv];
    const sees = (p, n) => n[0] * (C.x - p[0]) + n[1] * (C.eye - p[1]) + n[2] * (C.z - p[2]) > 0;
    const tone = (n) => -0.3 + 0.42 * Math.max(0, n[0] * KEY_L[0] + n[1] * KEY_L[1] + n[2] * KEY_L[2]);
    /* The building's own moment on the room's clock, the rule the table painters kept: counted from
       nightfall, so a building lit at 0.88 does not go dark again when the phase wraps at midnight. */
    const ph = dayPhase();
    const ease01 = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const np = ((((ph - 0.7) % 1) + 1) % 1) / 0.6;
    const NL = m.liton ? NIGHT() * ease01((np - (m.liton - 0.7) / 0.6) / 0.05) : NIGHT();
    let parent = null, seq = 0;
    const put = (pts, col, l, glow) => {
      const q = add(C, pts, Z64, "flat", col);
      if (!q) return null;
      q.lit = l;
      if (glow) q.nolite = true;
      if (parent !== null) q.sz = parent - 0.25 - (seq++) * 0.002;
      drawn.push(q);
      return q;
    };
    const late = (q, d) => { if (q && d) q.sz = (q.sz ?? q.z) + d; return q; };
    const newell = (W) => {
      let x = 0, y = 0, z = 0;
      for (let i = 0; i < W.length; i++) {
        const p = W[i], q = W[(i + 1) % W.length];
        x += (p[1] - q[1]) * (p[2] + q[2]); y += (p[2] - q[2]) * (p[0] + q[0]); z += (p[0] - q[0]) * (p[1] + q[1]);
      }
      const l = Math.hypot(x, y, z) || 1;
      return [x / l, y / l, z / l];
    };
    // A planar face given as [u, v, y] points; its outer side is decided against a point inside.
    const face = (pts, col, inside, l = 1, d = 0) => {
      const W = pts.map((p) => P(p[0], p[1], p[2]));
      let n = newell(W);
      const c = [0, 1, 2].map((i) => W.reduce((s, p) => s + p[i], 0) / W.length);
      const I = P(inside[0], inside[1], inside[2]);
      if (n[0] * (c[0] - I[0]) + n[1] * (c[1] - I[1]) + n[2] * (c[2] - I[2]) < 0) n = n.map((x) => -x);
      if (!sees(c, n)) return null;
      const keep = parent; parent = null;
      const q = late(put(W, mix(col, tone(n)), lit * l), d);
      parent = keep;
      return q;
    };
    /* A front-facing plane (+v) to lay things on that are not on a wall of `walls` -- a dormer's front,
       a pediment, a clock -- filed under the quad `q` they sit on. Call `done()` after. */
    const plane = (u0, v, q, side = 0) => {
      const nw = Nw(side ? side : 0, side ? 0 : 1);
      const F = side ? (t, y, o = 0.05) => P(u0 + side * o, v + (side > 0 ? -t : t), y)
                     : (t, y, o = 0.05) => P(u0 + t, v + o, y);
      return { F, nw, shade: tone(nw), len: 1e9, n: 1, at: () => { parent = q ? (q.sz ?? q.z) : null; seq = 0; } };
    };
    const done = () => { parent = null; };
    const centre = (poly) => [poly.reduce((s, p) => s + p[0], 0) / poly.length,
                              poly.reduce((s, p) => s + p[1], 0) / poly.length];
    /* Walls: a footprint (u, v) stood up from y0 to y1, every wall cut into bays about `bay` metres
       long. `dress(f)` lays a wall's features: f.F(t, y) runs along it to the right of someone facing
       it and up it, a hair proud; f.at(t) files what follows under the bay at t. `skip` lists walls
       that abut a taller part and are never seen. */
    const walls = (poly, y0, y1, col, bay, dress, skip, d = 0) => {
      // Which way is out is the footprint's winding, not its centre: a notched outline (the map's
      // real ones are) has walls whose outside faces the middle.
      let area2 = 0;
      poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; area2 += p[0] * q[1] - q[0] * p[1]; });
      const wind = area2 >= 0 ? 1 : -1;
      poly.forEach((p0, i) => {
        if (skip && skip.includes(i)) return;
        let A = p0, B = poly[(i + 1) % poly.length];
        const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
        if (len < 1e-6) return;
        const on = [wind * (B[1] - A[1]) / len, -wind * (B[0] - A[0]) / len];
        if ((B[0] - A[0]) * on[1] - (B[1] - A[1]) * on[0] < 0) { const swap = A; A = B; B = swap; }
        const eu = (B[0] - A[0]) / len, ev = (B[1] - A[1]) / len, nw = Nw(on[0], on[1]);
        const F = (t, y, o = 0.05) => P(A[0] + eu * t + on[0] * o, A[1] + ev * t + on[1] * o, y);
        if (!sees(F(len / 2, (y0 + y1) / 2, 0), nw)) return;
        // Bays are for sorting near the eye; from across the hall two or three to a bay do.
        const shade = tone(nw), n = Math.max(1, Math.round(len / (bay * (ppm < 2.5 ? 3 : ppm < 5 ? 2 : 1)))), zs = [];
        parent = null;
        for (let b = 0; b < n; b++) {
          const t0 = (len * b) / n, t1 = (len * (b + 1)) / n;
          const q = late(put([F(t0, y0, 0), F(t1, y0, 0), F(t1, y1, 0), F(t0, y1, 0)], mix(col, shade), lit), d);
          zs.push(q ? (q.sz ?? q.z) : null);
        }
        if (!dress) return;
        dress({ F, nw, shade, len, n, y0, y1, on, i,
                at: (t) => { parent = zs[Math.max(0, Math.min(n - 1, Math.floor((t / len) * n)))]; seq = 0; } });
        parent = null;
      });
    };
    // Things laid on a wall: a rectangle, a band across every bay, an opening, a disc.
    // A rect stands 0.08 out from its face while the face itself sits at 0.05: round 41's transfer-band
    // erasure showed what equality costs — the wall's surface and its flat decoration shared one plane,
    // the `__flat` batch has no polygonOffset, and the depth test let the facade draw over its own band.
    // Three centimetres of relief is invisible from any distance the kit paints at, and it makes every
    // painter's string courses, spandrels and glass safe at once instead of one hand-nudged loop at a
    // time. Windows and braces that survived before did so by batch order — luck; relief is the design.
    const rect = (f, t0, t1, y0, y1, col, l = 1) => {
      if (!seen(Math.min(Math.abs(t1 - t0), Math.abs(y1 - y0)), 0.6)) return null;
      f.at((t0 + t1) / 2);
      return put([f.F(t0, y0, 0.08), f.F(t1, y0, 0.08), f.F(t1, y1, 0.08), f.F(t0, y1, 0.08)],
                 mix(col, f.shade), lit * l);
    };
    const band = (f, y0, y1, col, l = 1) => {
      if (!seen(y1 - y0)) return;
      for (let b = 0; b < f.n; b++) rect(f, (f.len * b) / f.n, (f.len * (b + 1)) / f.n, y0, y1, col, l);
    };
    const opening = (f, tc, hw, y0, y1, rise) => {
      if (!rise) return [f.F(tc - hw, y0), f.F(tc + hw, y0), f.F(tc + hw, y1), f.F(tc - hw, y1)];
      const ys = y1 - rise, pts = [f.F(tc - hw, y0), f.F(tc + hw, y0)];
      for (let i = 0; i <= 8; i++) {
        const th = (i / 8) * Math.PI;
        pts.push(f.F(tc + hw * Math.cos(th), ys + rise * Math.sin(th)));
      }
      return pts;
    };
    const disc = (f, tc, yc, r, col, l = 1, glow = false) => {
      if (!seen(r)) return null;
      f.at(tc);
      const pts = [];
      for (let i = 0; i < 14; i++) pts.push(f.F(tc + r * Math.cos((i / 14) * 2 * Math.PI), yc + r * Math.sin((i / 14) * 2 * Math.PI)));
      return put(pts, glow ? col : mix(col, f.shade), glow ? l : lit * l, glow);
    };
    const GLASS = "#222a35";
    /* A window: its surround, dark glass by day and lamplight from this building's moment on, and the
       bars that make it a sash and not a slot. w x h is the opening; o.rise arches its head. */
    const win = (f, tc, w, y0, h, o = {}) => {
      if (!seen(w, 1.4)) return;
      f.at(tc);
      const hw = w / 2, s = o.fw ?? 0.2, rise = o.rise || 0;
      if (o.frame && seen(s)) put(opening(f, tc, hw + s, y0 - s, y0 + h + s, rise ? rise + s : 0), mix(o.frame, f.shade), lit);
      const g = opening(f, tc, hw, y0, y0 + h, rise);
      put(g, o.glass ? mix(o.glass, f.shade) : GLASS, lit * 0.9);
      if (NL > 0.02 && o.lamp !== 0) {
        put(g, `rgba(255,210,146,${(0.82 * NL * (o.lamp ?? 1)).toFixed(3)})`, 1.1 + 0.35 * NL, true);
      }
      if (o.bars && seen(Math.max(0.07, w * 0.06), 0.7)) {
        const b = Math.max(0.07, w * 0.06), c = mix(o.bars, f.shade), cols = o.cols || 2, top = y0 + h - rise * 0.4;
        for (let i = 1; i < cols; i++) {
          const t = tc - hw + (w * i) / cols;
          put([f.F(t - b / 2, y0), f.F(t + b / 2, y0), f.F(t + b / 2, top), f.F(t - b / 2, top)], c, lit);
        }
        (o.rows || [0.62]).forEach((r) => {
          const y = y0 + (h - rise) * r;
          put([f.F(tc - hw, y - b / 2), f.F(tc + hw, y - b / 2), f.F(tc + hw, y + b / 2), f.F(tc - hw, y + b / 2)], c, lit);
        });
      }
    };
    /* Roofs. `roof` is hipped over [u0,u1]x[v0,v1], eaves at y0, the ridge h higher along the longer
       side; an end marked "wall" runs the ridge into a taller part instead of hipping. `frustum` is a
       sloped band from one footprint up to a smaller one (a mansard's steep slope, a pavilion's cap). */
    const roof = (u0, u1, v0, v1, y0, h, col, o = {}) => {
      const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, hu = (u1 - u0) / 2, hv = (v1 - v0) / 2, y1 = y0 + h;
      const I = [cu, cv, y0 + h * 0.25], d = o.d || 0, out = {};
      if (hu >= hv) {
        const a0 = o.left === "wall" ? u0 : u0 + hv, a1 = o.right === "wall" ? u1 : u1 - hv;
        out.front = face([[u0, v1, y0], [u1, v1, y0], [a1, cv, y1], [a0, cv, y1]], col, I, 1, d);
        out.back = face([[u1, v0, y0], [u0, v0, y0], [a0, cv, y1], [a1, cv, y1]], col, I, 1, d);
        if (o.left !== "wall") out.left = face([[u0, v0, y0], [u0, v1, y0], [a0, cv, y1]], col, I, 1, d);
        if (o.right !== "wall") out.right = face([[u1, v1, y0], [u1, v0, y0], [a1, cv, y1]], col, I, 1, d);
      } else {
        const b0 = o.back === "wall" ? v0 : v0 + hu, b1 = o.front === "wall" ? v1 : v1 - hu;
        out.right = face([[u1, v1, y0], [u1, v0, y0], [cu, b0, y1], [cu, b1, y1]], col, I, 1, d);
        out.left = face([[u0, v0, y0], [u0, v1, y0], [cu, b1, y1], [cu, b0, y1]], col, I, 1, d);
        if (o.front !== "wall") out.front = face([[u0, v1, y0], [u1, v1, y0], [cu, b1, y1]], col, I, 1, d);
        if (o.back !== "wall") out.back = face([[u1, v0, y0], [u0, v0, y0], [cu, b0, y1]], col, I, 1, d);
      }
      return out;
    };
    const inset = (poly, s) => {                       // a convex footprint pulled in by s all round
      const [cu, cv] = centre(poly), L = poly.length, lines = [];
      for (let i = 0; i < L; i++) {
        const A = poly[i], B = poly[(i + 1) % L], len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
        let n = [-(B[1] - A[1]) / len, (B[0] - A[0]) / len];
        if (n[0] * (cu - A[0]) + n[1] * (cv - A[1]) < 0) n = [-n[0], -n[1]];
        lines.push({ p: [A[0] + n[0] * s, A[1] + n[1] * s], d: [(B[0] - A[0]) / len, (B[1] - A[1]) / len] });
      }
      return lines.map((l1, i) => {
        const l0 = lines[(i + L - 1) % L], den = l0.d[0] * l1.d[1] - l0.d[1] * l1.d[0];
        if (Math.abs(den) < 1e-9) return l1.p;
        const t = ((l1.p[0] - l0.p[0]) * l1.d[1] - (l1.p[1] - l0.p[1]) * l1.d[0]) / den;
        return [l0.p[0] + l0.d[0] * t, l0.p[1] + l0.d[1] * t];
      });
    };
    const lid = (poly, y, col, d = 0) => {
      const [cu, cv] = centre(poly);
      return face(poly.map((p) => [p[0], p[1], y]), col, [cu, cv, y - 1], 1, d);
    };
    const frustum = (poly, y0, poly2, y1, col, top, d = 0) => {
      const [cu, cv] = centre(poly), I = [cu, cv, (y0 + y1) / 2], out = [];
      poly.forEach((A, i) => {
        const j = (i + 1) % poly.length;
        out.push(face([[A[0], A[1], y0], [poly[j][0], poly[j][1], y0], [poly2[j][0], poly2[j][1], y1],
                       [poly2[i][0], poly2[i][1], y1]], col, I, 1, d));
      });
      if (top) lid(poly2, y1, top, d);
      return out;
    };
    const ngon = (cu, cv, r, n, rot = 0) => {
      const pts = [];
      for (let i = 0; i < n; i++) pts.push([cu + r * Math.cos(rot + (i / n) * 2 * Math.PI), cv + r * Math.sin(rot + (i / n) * 2 * Math.PI)]);
      return pts;
    };
    const spire = (poly, y0, apex, col, d = 0) => {
      const [cu, cv] = centre(poly);
      poly.forEach((A, i) => {
        const B = poly[(i + 1) % poly.length];
        face([[A[0], A[1], y0], [B[0], B[1], y0], apex], col, [cu, cv, y0 + 0.05], 1, d);
      });
    };
    const dome = (cu, cv, r, y0, h, n, rot, col, d = 0) => {
      const I = [cu, cv, y0 + 0.02], R = 3;
      for (let j = 0; j < R; j++) {
        const a0 = (j / R) * Math.PI / 2, a1 = ((j + 1) / R) * Math.PI / 2;
        const r0 = r * Math.cos(a0), r1 = r * Math.cos(a1), h0 = y0 + h * Math.sin(a0), h1 = y0 + h * Math.sin(a1);
        for (let i = 0; i < n; i++) {
          const t0 = rot + (i / n) * 2 * Math.PI, t1 = rot + ((i + 1) / n) * 2 * Math.PI;
          const c0 = [Math.cos(t0), Math.sin(t0)], c1 = [Math.cos(t1), Math.sin(t1)];
          const pts = j < R - 1
            ? [[cu + r0 * c0[0], cv + r0 * c0[1], h0], [cu + r0 * c1[0], cv + r0 * c1[1], h0],
               [cu + r1 * c1[0], cv + r1 * c1[1], h1], [cu + r1 * c0[0], cv + r1 * c0[1], h1]]
            : [[cu + r0 * c0[0], cv + r0 * c0[1], h0], [cu + r0 * c1[0], cv + r0 * c1[1], h0], [cu, cv, y0 + h]];
          face(pts, col, I, 1, d);
        }
      }
    };
    // A finial or a flagpole: two thin crossed blades, which read as a rod from any side.
    const spike = (u, v, y0, y1, w, col, d = -2) => {
      late(put([P(u - w, v, y0), P(u + w, v, y0), P(u + w, v, y1), P(u - w, v, y1)], col, lit), d);
      late(put([P(u, v - w, y0), P(u, v + w, y0), P(u, v + w, y1), P(u, v - w, y1)], col, lit), d);
    };
    /* A dormer on a front-facing slope running from (ve, ye) at the eaves to (vr, yr) at the ridge: an
       upright front with its window, cheeks cut to the slope, and a small roof of two planes. */
    const dormer = (uc, vf, w, h, ve, ye, vr, yr, col, roofCol, o = {}) => {
      if (!seen(w, 2)) return;
      const hw = w / 2, gy = (v) => ye + ((ve - v) / (ve - vr)) * (yr - ye);
      const yS = gy(vf), yT = yS + h, yA = yT + (o.rise ?? hw * 0.75);
      const back = (y) => ve - ((y - ye) / (yr - ye)) * (ve - vr);
      const vt = back(yT), vb = back(yA + 0.1), d = o.d ?? -14, I = [uc, (vf + vt) / 2, yS + 0.02];
      const front = [[uc - hw, vf, yS], [uc + hw, vf, yS], [uc + hw, vf, yT]];
      if (o.round) {
        for (let i = 1; i < 8; i++) {
          const th = (i / 8) * Math.PI;
          front.push([uc + hw * Math.cos(th), vf, yT + (yA - yT) * Math.sin(th)]);
        }
      } else front.push([uc, vf, yA]);
      front.push([uc - hw, vf, yT]);
      const fq = face(front, col, I, 1, d);
      face([[uc - hw, vf, yS], [uc - hw, vf, yT], [uc - hw, vt, yT]], col, I, 1, d);
      face([[uc + hw, vf, yS], [uc + hw, vf, yT], [uc + hw, vt, yT]], col, I, 1, d);
      face([[uc - hw - 0.12, vf + 0.15, yT - 0.05], [uc, vf + 0.15, yA + 0.1], [uc, vb, yA + 0.1], [uc - hw - 0.12, vt, yT - 0.05]],
           roofCol, [uc, vt, yS], 1, d - 1);
      face([[uc + hw + 0.12, vf + 0.15, yT - 0.05], [uc, vf + 0.15, yA + 0.1], [uc, vb, yA + 0.1], [uc + hw + 0.12, vt, yT - 0.05]],
           roofCol, [uc, vt, yS], 1, d - 1);
      if (fq && o.glass !== false) {
        const f = plane(uc - hw, vf, fq), ww = w * 0.56;
        win(f, hw, ww, yS + h * 0.18, h * 0.8 + (o.round ? (yA - yT) * 0.5 : 0),
            { frame: o.frame, fw: 0.1, rise: o.round ? ww / 2 : 0, lamp: o.lamp ?? 0.6 });
        done();
      }
    };
    return { k, P, put, face, walls, rect, band, opening, disc, win, roof, inset, lid, frustum, ngon,
             spire, dome, spike, late, plane, done, dormer, seen, NL, mix, tone };
  };

  const box = (C, q) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    /* Round 69m: a point at or behind the near plane has no screen position, and dividing by its
       depth does not make one -- it makes 84,326 by 99,753. Measured on rooms-goat.html: standing at
       Terrapin Point (stop 2) and looking at the Horseshoe, the falls' own click box became
       84326x99753 px and was then culled by the bounds test, so the thing filling the view was
       unpressable -- and its stale width stayed on the element for every frame after. The projection
       is clamped to the near plane here, and to a frame's worth of overflow, so a screen-filling
       prop stays a target and a degenerate one is merely small. */
    q.pts.forEach((p) => {
      if (!(p.z > 0)) return;
      const z = Math.max(p.z, NEAR);
      const sx = W * 0.5 + (focal * p.x) / z, sy = H * 0.5 + (focal * p.y) / z;
      x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
    });
    if (!Number.isFinite(x0)) return [W * 0.5, H * 0.5, W * 0.5, H * 0.5];
    x0 = Math.max(x0, -W); x1 = Math.min(x1, W * 2);
    y0 = Math.max(y0, -H); y1 = Math.min(y1, H * 2);
    // Absolute corners, not [x0, y0, w, h]: the hit-box union below maxes x1/y1 against the other
    // faces' absolute edges. A relative width here met that union as if it were an edge, so any
    // object drawn as a single quad — the chain doors, the wall frames, a drain plate — came out
    // with a negative width and was culled as invisible: real, painted, and untouchable.
    return [x0, y0, x1, y1];
  };
  /* Lighting, in the order a night actually works: the level the eye has adapted to, then a
     distance-squared falloff from each source, then the air in between. The sources are the same
     list the bulbs, their cords and their glows are drawn from, so no wall is bright where nothing
     shining at it. The first pass here had one lamp and a murk ceiling of 0.94, which is exactly why
     it read as a black rectangle: an eye never adapts to 6% of a material. */
  // Two exposures, chosen by the operating system rather than by a widget in my corner: a screen
  // that is dim, or an eye that needs more contrast, is the visitor's own setting to change.
  const boost = matchMedia("(prefers-contrast: more)").matches;
  const AMBIENT = boost ? 0.6 : 0.42;   // what the lane looks like with every bulb gone
  const FOG_MAX = boost ? 0.4 : 0.6;    // how much air may stand between you and the far wall
  const authored = readIsland("[data-walk-lights]");
  const lamps = (authored.length ? authored : [{ x: 0, y: CEIL - 34, z: Z_FAR * 0.5, r: 40 }]).map((L) => ({
    x: L.x, y: L.y, z: L.z, r: L.r || 30, k: L.k === undefined ? 0.5 : L.k,
    tint: L.tint || (L.bulb === false ? "rgba(255,192,104,0.5)" : "rgba(255,216,158,0.42)"),
    wet: L.bulb !== false, bulb: L.bulb !== false && !L.of,
    // Sources with something hanging from the wire: a bulb is a dot of light, a lantern is a body you
    // can walk under. Which lights have a body is decided by the district, not by the renderer.
    body: L.body || null, size: L.size || 0, h: L.h || 0,
    of: L.of || null, k0: L.k === undefined ? 0.5 : L.k,
    swing: L.swing || 0, period: L.period || 4, phase: L.phase || 0,
    /* The night's two fields, and each of them has to be listed here or it does not exist: the
       island is JSON and this map is the renderer's whole vocabulary. `liton` is the phase at which
       this source comes up (inherited from its prop by the emitter, so a shop's windows and its
       pavement rise together); `spill` makes the light on the ground a splash along a front rather
       than a pool under a fitting. A field the emitter stamps and this map drops is the trap
       `skills/lane-prop` §7 was written about, seen from the other end. */
    liton: L.liton || 0, spill: L.spill || 0,
  }));
  // Time, sampled once per frame: a lantern that swings on a clock of its own while everything else
  // uses another is how a scene starts to shimmer.
  let T = 0;
  /* The hall's own day.

     Little Canada runs every exhibit on one synchronised day-night cycle -- a show-control system
     coordinating moving vehicles, projections and thousands of channels of building illumination,
     so that at "sunset" thousands of tiny window lights come up at once. It is the single thing
     that most makes a model hall feel inhabited, and until now this hall had one fixed lighting
     state, which is a diorama in a shop window.

     Its cycle is fifteen minutes. Ours is four: a visitor to a web page does not stay fifteen
     minutes, and a cycle nobody sees is decoration rather than day. The walk opens in the late
     afternoon so the lamps come up while you are standing there instead of after you have gone. */
  /* The hour is the visitor's, not the browser's clock (round 49, at the owner's insistence: the
     fifteen-minute hall had people walking into a blackout they never asked for). A lane opens in
     full day and stays there until the sun/moon button says otherwise; the choice rides
     localStorage across every lane. NIGHT is held at 0.92 — the hour the records themselves hold
     their authored nights at (the LookOut's window), so lamps, lit windows and the falls' own
     colours come up exactly as authored, and the murk stays the navy the painter folds by. A place
     held at its own hour (`laneNight`) keeps it and gets no button: its clock is a fact. */
  const HOUR_KEY = "huaxu.walk-hour.v1";
  const HOUR_NIGHT = 0.92;
  let hourPref = "day";
  let hourPhaseSet = 0.5;
  /* Round 76: whether the visitor has chosen at all. A page's own opening hour (`data-lane-day-start`)
     may only apply when they have not -- otherwise the sun/moon button would be overruled by the
     record every time the page loaded. */
  let hourChosen = false;
  try {
    const stored = window.localStorage.getItem(HOUR_KEY);
    if (stored) hourChosen = true;
    if (stored === "night") { hourPref = "night"; hourPhaseSet = HOUR_NIGHT; }
  } catch (e) { /* private mode: the choice lives this visit only */ }
  const dayPhase = () => hourPhaseSet;                  // the station clock reads the hour the visitor
                                                         // chose, so the hands and the light agree
  const NIGHT = () => 1 - sunNow();
  /* A lane whose place is a day.

     There is no running clock anywhere in this lane (round 49: a visitor walked into a blackout they
     never asked for, and the hour has been theirs since). What a day page has instead is the hour it
     *opens* at, authored in the record and stamped on the layer with everything else the renderer
     reads (`data-lane-day-start`), because a place's own day belongs to the place: the street opens
     at noon and stays there until the visitor says otherwise. No cycle, no drift -- a page that
     changed the light on its own would be the blackout with a slower fuse. */
  const DAYPAGE = attr("laneDay", 0) ? true : false;
  /* Round 76 -- `data-lane-day-cycle` and `data-lane-day-start` were stamped on four pages and read
     into two constants that nothing used, so `_walkshot.mjs` and `_lumacheck.mjs` rewrote the start
     to 0.9 to photograph dusk and got noon: the knob they were turning had no wire on it. The cycle
     belongs to a clock this site no longer runs (the hour is the visitor's, see above), so it is gone
     from the markup; the start now *is* the opening phase, for a page that opens at its own hour and
     a visitor who has not chosen one. 0.5 is noon, which is what every page opened at before. */
  /* Read by hand, not through `attr()`: that helper falls back on a falsy parse, so a page authored to
     open at phase 0 (midnight) would silently open at 0.5 instead — the same class of defect as the
     unwired knob this constant used to be. */
  const dayAtAttr = parseFloat(layer.dataset.laneDayStart);
  const DAY_AT = Number.isFinite(dayAtAttr) ? dayAtAttr : 0.5;
  const DAY_GAIN = attr("laneDayGain", 1);
  if (DAYPAGE && !hourChosen) hourPhaseSet = clamp(DAY_AT, 0, 1);
  // A place held at one hour of the night (`data-lane-night`, a phase): the LookOut's window shows a
  // night that does not move, so its lamps and air stop following the hall's clock (round 33).
  const HELD = attr("laneNight", 0);
  if (HELD) hourPhaseSet = HELD;   // held places pin the clock — and (no button) the visitor's choice
  const phaseNow = () => hourPhaseSet;
  const sunNow = () => clamp(Math.sin((phaseNow() - 0.25) * Math.PI * 2) * 0.5 + 0.5, 0, 1);
  /* How much sun is on the place, as a factor rather than a truth: 0 from dusk to dawn, 1 at noon.
     The floor is what decides whether a room reads as "lit by its own lamps" or "outdoors", and 0.45
     is chosen so dawn and dusk are still dusk. */
  const DAY = () => (DAYPAGE ? clamp((sunNow() - 0.45) / 0.45, 0, 1) : 0);
  /* Where the sun stands across the lane, −1 east (left) at dawn through 0 at noon to +1 west at
     dusk, and how high it is in degrees. The shadow system below is authored from these two: a
     wall's shadow is as long as the wall is tall divided by the tangent of the altitude, and it
     lies on whichever side the azimuth says — which is what makes a morning and an afternoon
     different streets, without a shadow map. */
  const sunAz = () => -Math.cos((phaseNow() - 0.25) * Math.PI * 2);
  const sunAlt = () => (8 + 62 * sunNow()) * Math.PI / 180;
  const swayOf = (L) => (!L.swing || reduce() ? 0 : Math.sin(T * 6.28319 / L.period + L.phase) * L.swing);
  const lightAt = (px, py, pz) => {
    let v = AMBIENT * (0.18 + 0.82 * sunNow());
    let lit = 0;
    for (let i = 0; i < lamps.length; i++) {
      const L = lamps[i];
      const d2 = (px - L.x) * (px - L.x) + (pz - L.z) * (pz - L.z) + (py - L.y) * (py - L.y) * 0.4;
      lit += L.k / (1 + d2 / 44000);          // half-light at 210 cm: a bulb, not a searchlight
    }
    /* A bulb is worth more after dark. By day the hall is lit by its own roof and the tables read
       as furniture; after dusk the roof goes and the models are the only things still bright, which
       is why a model hall is kept dim. The two terms move in opposite directions on purpose --
       raising everything at once would be a brightness slider, not a day. */
    v += lit * (1.0 - 0.22 * NIGHT());
    return Math.min(1.7, v);
  };
  /* Air. `FOG_MAX` is the hall's murk, and it is what made the first daylight pass read as a
     foggy morning rather than a sunny street: measured at noon with the lift in and the haze
     unchanged, the whole-frame luma was 180.7 while the floor and the middle of the frame differed
     by 3 points. Where the record says the place is a day, the air clears as the sun rises. */
  const haze = (z) => clamp((z - 420) / 2450, 0, 1) * FOG_MAX * (DAYPAGE ? 1 - 0.62 * DAY() : 1);
  /* Round 64: the ground's own air.

     The floor took its wash from `haze(z)`, which is the lane's *depth*. On a short street the
     lane's depth and the distance to the far wall are the same thing, so the two agreed by
     accident. On a hundred-metre lane they are not: Clifton Hill's plaza is eighty metres down
     this one, and the paving under the visitor's own feet was washed as hard as the paving a
     mile away, so the joints were in the picture and not in the eye — the plaza read as one pale
     sheet, which is what the owner kept reporting about it.

     The ground's air is now the air between the eye and the ground, which is what a fog is. The
     walls never took this wash, so the ground and the wall a visitor leans on now agree with
     each other instead of disagreeing with the ground underfoot. */
  const groundAir = (z, camZ) => clamp((Math.abs(z - camZ) - 420) / 2450, 0, 1) * FOG_MAX * 0.7
    * (DAYPAGE ? 1 - 0.62 * DAY() : 1);

  const drawMarks = (C) => {
    // The ground's own kit: the tactile guide path along each wall, a painted gutter line at the
    // threshold, grates, one manhole, and a wet patch that is only worth drawing because something
    // above it is bright enough to be seen in it.
    marks.forEach((mk) => {
      const pat = PATS[mk.kind];
      if (mk.kind === "manhole") {
        const cx = (mk.x0 + mk.x1) / 2, cz = (mk.z0 + mk.z1) / 2, r = (mk.x1 - mk.x0) / 2;
        const ring = (rad, col) => {
          const pts = [];
          for (let i = 0; i < 8; i++) {
            const a0 = (i / 8) * 6.2832;
            pts.push([cx + Math.cos(a0) * rad, 1, cz + Math.sin(a0) * rad * 0.8]);
          }
          const q = add(C, pts, ZERO8.slice(0, 16), "flat", col);
          if (q) { q.lit = lightAt(cx, 2, cz); q.air = groundAir(q.z, C.z); }
        };
        ring(r, "#2b3648");
        ring(r * 0.78, "#1a2330");
        return;
      }
      if (mk.kind === "kerb") {
        // Only the face is drawn. The top of a six centimetre kerb is the thing you stand on rather
        // than the thing you look at, and giving it its own quad would be 50 more depth-sorted
        // rectangles to disagree with the bins and crates that sit on it.
        const px = mk.x0 < 0 ? mk.x1 : mk.x0;
        // Half the wall's resolution is enough here, and it is worth saying why: the kerb's tile has
        // no joint lines to keep honest, so the only error a wider panel makes is a soft bend in the
        // lip — against 50 more depth-sorted quads for a six centimetre band.
        const step = SEG * 2;
        for (let z = Math.floor(mk.z0 / step) * step; z < mk.z1; z += step) {
          const za = Math.max(z, mk.z0), zb = Math.min(z + step, mk.z1);
          if (zb - za < 1) continue;
          const q = add(C, [[px, 0, za], [px, 0, zb], [px, mk.y1, zb], [px, mk.y1, za]],
              [za * DPM, 0, zb * DPM, 0, zb * DPM, -mk.y1 * DPM, za * DPM, -mk.y1 * DPM],
              "pat", PATS.kerb);
          if (q) { q.lit = lightAt(px, 3, (za + zb) / 2) * 1.18; q.air = groundAir(q.z, C.z); }
        }
        return;
      }
      if (mk.kind === "snow") {
        /* Snow is a ground cover, not a surface with ribs: a flat fill is exactly right, and it is
           brighter than anything else on the walk because snow is. It is drawn as one quad per mark,
           because a rectangle this shape under an affine map bends by nothing anyone can see — unlike
           the lane's floor, this is not a plane running to the horizon. */
        const q = add(C, [[mk.x0, 1, mk.z0], [mk.x1, 1, mk.z0], [mk.x1, 1, mk.z1], [mk.x0, 1, mk.z1]],
                      ZERO8, "flat", "#c3d3e6");
        if (q) { q.lit = lightAt((mk.x0 + mk.x1) / 2, 6, (mk.z0 + mk.z1) / 2) * 1.0; q.air = groundAir(q.z, C.z) * 0.86; }
        return;
      }
      if (mk.kind === "wet") {
        const q = add(C, [[mk.x0, 1, mk.z0], [mk.x1, 1, mk.z0], [mk.x1, 1, mk.z1], [mk.x0, 1, mk.z1]],
                      ZERO8, "flat", "rgba(150,182,224,0.10)");
        if (q) { q.air = 0; q.lit = 0.2; }
        return;
      }
      const long = (mk.z1 - mk.z0) > SEG;
      const steps = long ? Math.ceil((mk.z1 - mk.z0) / SEG) : 1;
      for (let i = 0; i < steps; i++) {
        const z0 = mk.z0 + (i / steps) * (mk.z1 - mk.z0);
        const z1 = mk.z0 + ((i + 1) / steps) * (mk.z1 - mk.z0);
        const q = add(C, [[mk.x0, 1, z0], [mk.x1, 1, z0], [mk.x1, 1, z1], [mk.x0, 1, z1]],
            [z0 * DPM * 2, mk.x0 * DPM * 2, z0 * DPM * 2, mk.x1 * DPM * 2,
             z1 * DPM * 2, mk.x1 * DPM * 2, z1 * DPM * 2, mk.x0 * DPM * 2], "pat", pat);
        if (q) {
          q.lit = lightAt((mk.x0 + mk.x1) / 2, 4, (z0 + z1) / 2) * (mk.kind === "gutter" ? 0.8 : 1.05);
          q.air = groundAir(q.z, C.z);
        }
      }
    });
  };

  const drawFar = (C) => {
    /* One convention, stated once: the compound is authored in scene centimetres, and the far plane is
       authored at the scale a *picture* of Tokyo shows rather than 1:1 — a mountain does not fit in a
       space that is 12 m long, and pretending it did is the sort of flourish this lane refuses. The
       air on these quads is authored instead of taken from `haze()`, because fog computed from a z of
       90000 would erase the very thing the window exists to show. */
    /* The compound by day.

       Its colours are the record's and they were authored for a night: a deep navy sky, a dark
       mountain, a plaza that reads as wet asphalt. Sunlight does not fall on a mountain 1 200 m away
       in this renderer — but *air* does, and what daylight does to a distance is wash it pale. So the
       sky, the mountain and its cap are blended toward the day haze by how high the sun is, at a
       strength of their own: the sky nearly all the way (it is the thing the light comes out of), the
       mountain about half, and the cap almost not at all, because snow stays white. Everything here
       that is a *surface* — the plaza, the crossing, the roofs, the city — takes the lane's own lift
       instead, because the sun does fall on those. */
    const dayC = (hex, k) => (DAYPAGE && DAY() > 0.01
      ? blendHex(hex, blendHex(hex, "#d3e3f4", 0.62), DAY() * k) : hex);

    const skyBands = bd.sky || [];
    if (!(bd.skyGradient && skyBands.length && threeRenderer)) {

      // Keep the established scene idiom for every backdrop that has not asked for the continuous
      // outdoor gradient; the street's port is a scoped treatment, not a global reskin of room skies.
      skyBands.forEach((b) => {
        const q = add(C, [[-150000, b.y0, 120000], [150000, b.y0, 120000],
                          [150000, b.y1, 120000], [-150000, b.y1, 120000]],
                      ZERO8, "flat", dayC(b.c, 0.92), null);
        if (q) { q.air = 0; q.lit = b.glow || 0; q.day = false; }
      });
    }
    const mt = bd.mountain;
    if (mt) {
      const q = add(C, [[mt.x - mt.half, mt.base, mt.z], [mt.x + mt.half, mt.base, mt.z],
                        [mt.x + mt.crown, mt.top, mt.z], [mt.x - mt.crown, mt.top, mt.z]],
                    ZERO8, "flat", dayC(mt.c || "#2e3d5c", 0.45), null);
      if (q) { q.air = 0.12; q.lit = 0.3; q.day = false; }
      const line = mt.top - (mt.top - mt.base) * mt.snow;
      const cap = add(C, [[mt.x - mt.crown, mt.top, mt.z], [mt.x + mt.crown, mt.top, mt.z],
                          [mt.x + mt.crown * 1.9, line, mt.z], [mt.x - mt.crown * 1.9, line, mt.z]],
                      ZERO8, "flat", dayC("#c9d8f2", 0.12), null);
      if (cap) { cap.air = 0.14; cap.lit = 0.5; cap.day = false; }
    }
    const tw = bd.tower;
    if (tw) {
      const taper = (y) => tw.half * (1 - (y / tw.top) * 0.84);
      // Three banded sections, two decks and a mast: at night the tower reads as stripes of colour,
      // and a lattice nobody can resolve at that distance would be decoration, not sightline.
      const cuts = [0, tw.top * 0.42, tw.top * 0.72, tw.top];
      for (let i = 0; i < cuts.length - 1; i++) {
        const y0 = cuts[i], y1 = cuts[i + 1];
        const q = add(C, [[tw.x - taper(y0), y0, tw.z], [tw.x + taper(y0), y0, tw.z],
                          [tw.x + taper(y1), y1, tw.z], [tw.x - taper(y1), y1, tw.z]],
                      ZERO8, "flat", i % 2 ? "#c9613a" : "#e8e2d4", null);
        if (q) { q.air = 0.1; q.lit = 0.62; }
      }
      const mast = add(C, [[tw.x - 18, tw.top, tw.z], [tw.x + 18, tw.top, tw.z],
                           [tw.x + 6, tw.mast, tw.z], [tw.x - 6, tw.mast, tw.z]],
                       ZERO8, "flat", "#d8d2c4", null);
      if (mast) mast.air = 0.1;
      (tw.decks || []).forEach((dy) => {
        const w = taper(dy) * 1.5;
        const deck = add(C, [[tw.x - w, dy, tw.z], [tw.x + w, dy, tw.z],
                             [tw.x + w, dy + 90, tw.z], [tw.x - w, dy + 90, tw.z]],
                         ZERO8, "flat", "#f0d9a8", null);
        if (deck) { deck.air = 0.06; deck.lit = 0.9; }
      });
    }
    /* Hōzōmon and the five-storey pagoda at the head of Nakamise (round 32; TODO §0n). The gate is
       22.7 m tall, 21 m wide and 8 m deep, rebuilt in 1964 in reinforced concrete; its centre bay
       hangs the Kobunachō lantern (3.75 m tall, 2.7 m across, red; its characters are writing and
       are left off) between two copper tōrō 2.75 m tall, and the Niō stand in the outer bays behind
       grilles and are not drawn. The pagoda stands 56 m west and 19 m north of the gate's centre
       (OpenStreetMap), 53.32 m to the top of its finial. Both are floodlit until 23:00, so they are
       lit at night and fall back toward silhouette in the hours the hall calls day. */
    const tp = bd.temple;
    if (tp) {
      const flood = 0.78 + 0.62 * NIGHT();
      const T0 = (pts, col, l, air = 0.06) => {
        const q = add(C, pts, new Array(pts.length * 2).fill(0), "flat", col, null);
        if (q) { q.lit = l; q.air = air; q.day = false; }
        return q;
      };
      const gx = tp.x || 0, gz = tp.z, G = tp.gate || { w: 2100, h: 2270 };
      const R = (x0, y0, x1, y1, z, col, l, air) =>
        T0([[gx + x0, y0, z], [gx + x1, y0, z], [gx + x1, y1, z], [gx + x0, y1, z]], col, l, air);
      const hw = G.w / 2, k = G.h / 2270, bay = G.w / 5;
      /* Round 69i: the gate was a picture of a building, not a building.

         Every piece of it was a quad at one z: the whole gatehouse lived inside 230 cm of depth, its
         roof was one trapezoid (sd 2.5 luma across it -- a single flat colour) and the frame it stood
         in held 60 quads. At 28 m that reads as a cut-out, and it is the last thing the lane shows a
         visitor. It now has the record's own 8 m: the centre bay is a passage clean through the mass,
         so the plaza sees a near face with a hole in it, two jambs receding to a far face and the
         courtyard's light at the end; the sides are walls an oblique stop can see; the roof is four
         slopes, a ridge and an eave whose underside is the dark band that gives a Japanese roof its
         weight. Nothing about the record's sizes moved: 21 m wide, 22.7 m to the cap, 8 m deep, five
         bays of 4.2 m, the lantern 3.75 m tall in the centre bay, the Nio in the outer bays. */
      const DZ = 400, zf = gz - DZ, zb = gz + DZ;   // 8 m deep; the plaza sees zf, the courtyard zb
      const PW = bay, PH = 830, t = 50 * k;         // clear opening of the passage, podium top
      // The podium: its face, its top, and the two returns under the side walls.
      R(-hw - 60, 0, hw + 60, t, zf - 110, "#6f6c66", flood * 0.72);
      T0([[gx - hw - 60, t, zf - 110], [gx + hw + 60, t, zf - 110],
          [gx + hw + 60, t, zb], [gx - hw - 60, t, zb]], "#7d7a74", flood * 0.8, 0.04);
      [-1, 1].forEach((s) => T0([[gx + s * (hw + 60), 0, zf - 110], [gx + s * (hw + 60), 0, zb],
                                 [gx + s * (hw + 60), t, zb], [gx + s * (hw + 60), t, zf - 110]],
                                "#6f6c66", flood * 0.66));
      // The near face, built around the passage: two piers and the lintel over the hole. The hole is
      // the whole point -- it is what makes the gate stand in front of the courtyard instead of on it.
      R(-hw, t, -PW / 2, 960 * k, zf, "#5a3024", flood * 0.62);
      R(PW / 2, t, hw, 960 * k, zf, "#5a3024", flood * 0.62);
      R(-PW / 2, PH, PW / 2, 960 * k, zf, "#5a3024", flood * 0.62);
      // The far face: the same three pieces, seen through the passage and from behind.
      R(-hw, t, -PW / 2, 960 * k, zb, "#5a3024", flood * 0.5);
      R(PW / 2, t, hw, 960 * k, zb, "#5a3024", flood * 0.5);
      R(-PW / 2, PH, PW / 2, 960 * k, zb, "#5a3024", flood * 0.5);
      // The passage's own walls and ceiling, out of the floods' reach, so the lantern is read against
      // a real shadow and the way through has a length.
      [-1, 1].forEach((s) => T0([[gx + s * PW / 2, t, zf], [gx + s * PW / 2, t, zb],
                                 [gx + s * PW / 2, PH, zb], [gx + s * PW / 2, PH, zf]],
                                "#3d211a", flood * 0.4, 0.02));
      T0([[gx - PW / 2, PH, zf], [gx + PW / 2, PH, zf], [gx + PW / 2, PH, zb], [gx - PW / 2, PH, zb]],
         "#2a1814", flood * 0.34, 0.02);
      // The gatehouse's own side walls: the faces an oblique stop sees, 8 m of them.
      [-1, 1].forEach((s) => T0([[gx + s * hw, t, zf], [gx + s * hw, t, zb],
                                 [gx + s * hw, 960 * k, zb], [gx + s * hw, 960 * k, zf]],
                                "#7a3326", flood * 0.7));
      // The Nio bays: the outer bays, behind their grilles, and never drawn themselves.
      for (let i = 0; i < 5; i++) {
        const x0 = -hw + i * bay;
        if (i !== 0 && i !== 4) continue;
        R(x0, 60 * k, x0 + bay, 900 * k, zf - 8, "#6a2a20", flood * 0.75);
        for (let j = 1; j < 8; j++) {
          const xb = x0 + (bay * j) / 8;
          R(xb - 5, 80 * k, xb + 5, 880 * k, zf - 12, "#8c3a2c", flood * 0.85);
        }
      }
      // Six pillars on the near face, standing proud of it, so the face has relief.
      for (let i = 0; i <= 5; i++) {
        const xp = -hw + i * bay;
        R(xp - 46, t, xp + 46, 960 * k, zf - 26, "#c8442f", flood * 1.05);
      }
      R(-hw - 40, 880 * k, hw + 40, 960 * k, zf - 30, "#ad3a2b", flood * 0.95);
      /* The lanterns: the red chōchin in the passage, the copper tōrō either side of it.
         Round 69h: the chōchin was drawn in six slices of the wall's own red (#c22f22) under the
         lane's night murk, and measured 69.7 luma against the pillar beside it at 68.8 and the paving
         at 72.5 -- the plaza's hero object was the *dimmest* thing standing in it, a flat maroon
         rectangle (sd 0.0 across its body). A paper lantern is a lamp: its paper carries its own
         light, so its slices are authored `nolite` (the idiom every lit window in this file already
         uses) and its body colour is the colour it gives off rather than the colour the wall gives
         back. The ribs are the lantern's own structure and are drawn, not shaded in. */
      const LR = 135 * k, Lb = 400 * k, Lt = 775 * k, LZ = gz;   // inside the passage now
      const CH = 10;                                    // slices up the body: 7 paper, 3 ribs
      const rib = (tt) => Math.abs(tt - 0.26) < 0.03 || Math.abs(tt - 0.5) < 0.03 || Math.abs(tt - 0.74) < 0.03;
      for (let i = 0; i < CH; i++) {
        const t0 = i / CH, t1 = (i + 1) / CH;
        const r0 = LR * (0.84 + 0.16 * Math.sin(Math.PI * t0)), r1 = LR * (0.84 + 0.16 * Math.sin(Math.PI * t1));
        const cap = t0 < 0.1 || t1 > 0.9;
        const q = T0([[gx - r0, Lb + (Lt - Lb) * t0, LZ], [gx + r0, Lb + (Lt - Lb) * t0, LZ],
                      [gx + r1, Lb + (Lt - Lb) * t1, LZ], [gx - r1, Lb + (Lt - Lb) * t1, LZ]],
                     cap ? "#241a16" : rib(t0) ? "#7d2b20" : "#e8503a", flood * (cap ? 0.9 : 1.35));
        if (q && !cap) q.nolite = true;                 // the paper is the lamp; the caps are metal
      }
      // The cord that hangs it, from the passage ceiling to its cap.
      R(-4, Lt, 4, PH, LZ, "#1c1410", flood * 0.5);
      // What the lantern throws: a pool at the gate's foot, under it and no wider than the bay.
      const lp = T0([[gx - LR * 4, 2, zf - 30], [gx + LR * 4, 2, zf - 30],
                     [gx + LR * 5.2, 2, zf - 780], [gx - LR * 5.2, 2, zf - 780]],
                    `rgba(255,206,164,${(0.16 + 0.2 * NIGHT()).toFixed(3)})`, 1.25, 0.03);
      if (lp) lp.nolite = true;
      // The copper toro, 2.75 m, either side of the passage.
      [-1, 1].forEach((s) => {
        const cx = s * bay, top = 835 * k, bot = 560 * k, w2 = 55 * k;
        T0([[gx + cx - w2, bot, zf - 34], [gx + cx + w2, bot, zf - 34], [gx + cx + w2 * 0.8, top - 60 * k, zf - 34],
            [gx + cx - w2 * 0.8, top - 60 * k, zf - 34]], "#56614f", flood * 0.85);
        T0([[gx + cx - w2 * 1.3, top - 60 * k, zf - 35], [gx + cx + w2 * 1.3, top - 60 * k, zf - 35],
            [gx + cx, top, zf - 35]], "#3f4a3c", flood * 0.8);
      });
      // The pent roof between the storeys: a real slope with an overhang, and the shadowed soffit
      // under the overhang -- from 28 m out that underside is what says the roof is a roof.
      const E1 = hw + 260 * k, y1a = 960 * k, y1b = 1170 * k;
      T0([[gx - E1, y1a, zf - 320], [gx + E1, y1a, zf - 320],
          [gx + E1, y1b, zf + 60], [gx - E1, y1b, zf + 60]], "#323846", flood * 0.7);
      T0([[gx - E1, y1a, zf - 320], [gx + E1, y1a, zf - 320],
          [gx + hw, y1a, zf], [gx - hw, y1a, zf]], "#191d26", flood * 0.46, 0.04);
      R(-E1, y1a - 8, E1, y1a + 10, zf - 322, "#5a6170", flood * 0.8);
      // The upper storey: a box too, with its balustrade, its own pillars and a back wall.
      const UW = hw * 0.82;
      R(-hw * 0.86, y1b, hw * 0.86, 1250 * k, zf + 80, "#8f2f24", flood * 0.9);
      // the balustrade's posts, so the railing reads as a railing and not as a stripe
      for (let i = 0; i <= 11; i++) {
        const xp = -hw * 0.86 + i * (hw * 1.72 / 11);
        R(xp - 9, 1180 * k, xp + 9, 1250 * k, zf + 74, "#a83a2b", flood * 0.95);
      }
      R(-UW, 1250 * k, UW, 1650 * k, zf + 80, "#4d2a20", flood * 0.6);
      R(-UW, 1250 * k, UW, 1650 * k, zb - 80, "#43241c", flood * 0.5);
      [-1, 1].forEach((s) => T0([[gx + s * UW, 1250 * k, zf + 80], [gx + s * UW, 1250 * k, zb - 80],
                                 [gx + s * UW, 1650 * k, zb - 80], [gx + s * UW, 1650 * k, zf + 80]],
                                "#5a2c21", flood * 0.66));
      for (let i = 0; i <= 5; i++) {
        const xp = -hw * 0.82 + i * (hw * 1.64 / 5);
        R(xp - 26, 1250 * k, xp + 26, 1650 * k, zf + 76, "#c2412e", flood * 0.95);
      }
      // The great roof: four slopes and a ridge, with an eave that overhangs on every side.
      const E2 = hw + 420 * k, yE = 1640 * k, yR = 2190 * k, zE = 480, rH = hw * 0.62;
      T0([[gx - E2, yE, gz - zE], [gx + E2, yE, gz - zE],
          [gx + rH, yR, gz], [gx - rH, yR, gz]], "#2e3442", flood * 0.8);
      T0([[gx - E2, yE, gz + zE], [gx + E2, yE, gz + zE],
          [gx + rH, yR, gz], [gx - rH, yR, gz]], "#262b36", flood * 0.58);
      [-1, 1].forEach((s) => T0([[gx + s * E2, yE, gz - zE], [gx + s * E2, yE, gz + zE],
                                 [gx + s * rH, yR, gz]], "#333a48", flood * 0.7));
      // The eave's underside: one plane under the whole overhang, darker than the slope above it,
      // which is the band that gives the roof thickness when it is looked up at.
      T0([[gx - E2, yE, gz - zE], [gx + E2, yE, gz - zE],
          [gx + E2, yE, gz + zE], [gx - E2, yE, gz + zE]], "#171b23", flood * 0.4, 0.03);
      // The eave tips at the corners, and the fascia along the front edge.
      [-1, 1].forEach((s) => T0([[gx + s * E2, yE, gz - zE - 2], [gx + s * (E2 + 60 * k), yE + 80 * k, gz - zE - 2],
                                 [gx + s * (E2 - 120 * k), yE + 60 * k, gz - zE - 2]], "#4f5667", flood * 0.8));
      R(-E2, yE - 16, E2, yE + 16, gz - zE - 2, "#5a6170", flood * 0.8);
      // The ridge: the two planes meet under a cap, and the cap's faces are what a viewer sees
      // instead of the seam.
      T0([[gx - hw * 0.66, yR, gz - 150], [gx + hw * 0.66, yR, gz - 150],
          [gx + hw * 0.66, G.h, gz], [gx - hw * 0.66, G.h, gz]], "#262b36", flood * 0.82);
      T0([[gx - hw * 0.66, yR, gz + 150], [gx + hw * 0.66, yR, gz + 150],
          [gx + hw * 0.66, G.h, gz], [gx - hw * 0.66, G.h, gz]], "#22262f", flood * 0.68);
      // The floodlights' spill on the plaza in front of the gate: the light that makes it a place to stand.
      T0([[gx - hw - 400, 2, gz - 2200], [gx + hw + 400, 2, gz - 2200], [gx + hw + 200, 2, gz - 60],
          [gx - hw - 200, 2, gz - 60]], `rgba(255,214,160,${(0.1 + 0.12 * NIGHT()).toFixed(3)})`, 1.1, 0.04);
      /* The five-storey pagoda, 56 m west and 19 m north of the gate (OpenStreetMap), 53.32 m to the
         top of its finial, its base 150 cm of stone.

         Round 69i: like the gate it was a picture of a building. Every storey was a quad on one z,
         so from anywhere off the axis it was a red cut-out four metres thick at its thinnest, and
         its roofs were flat trapezoids with no overhang to see under. A pagoda's whole silhouette is
         its roofs' overhangs seen from below and its storeys stepping back -- neither exists on a
         plane. Each storey is now a box with four walls, the roof above it is four slopes with an
         overhang on every side and a drawn underside, and the balconies project. Sizes are the
         record's: five storeys, 53.32 m to the finial, base 12.4 m square, each storey's body
         narrower than the one below it. */
      const pg = tp.pagoda;
      if (pg) {
        const px = pg.x, pz = pg.z, PH = pg.h || 5332;
        const F = (pts, col, l, air = 0.1) => T0(pts, col, l, air);
        const L = (x0, y0, x1, y1, z, col, l) =>
          F([[px + x0, y0, pz + z], [px + x1, y0, pz + z], [px + x1, y1, pz + z], [px + x0, y1, pz + z]], col, l);
        // The stone base, 12.4 m square and 1.5 m of it, with its top and two returns.
        const B = 620, BH = 150;
        F([[px - B, BH, pz - B], [px + B, BH, pz - B], [px + B, BH, pz + B], [px - B, BH, pz + B]], "#77746e", flood * 0.75, 0.06);
        [-1, 1].forEach((sd) => {
          L(-B, 0, B, BH, sd * B, "#6a6762", flood * 0.62);                       // front / back
          F([[px + sd * B, 0, pz - B], [px + sd * B, 0, pz + B],
             [px + sd * B, BH, pz + B], [px + sd * B, BH, pz - B]], "#6a6762", flood * 0.55);   // sides
        });
        let y = BH;
        for (let i = 0; i < 5; i++) {
          // The body steps back storey by storey, as the record's silhouette does.
          const bw = 300 - i * 26, bh = 600 - i * 30, rw = 660 - i * 46, rd = rw * 0.82;
          // four walls of the body
          L(-bw, y, bw, y + bh, -rd, "#bf412e", flood * (1 - i * 0.03));
          L(-bw, y, bw, y + bh, rd, "#a83a2b", flood * (1 - i * 0.03) * 0.82);
          [-1, 1].forEach((sd) => F([[px + sd * bw, y, pz - rd], [px + sd * bw, y, pz + rd],
                                     [px + sd * bw, y + bh, pz + rd], [px + sd * bw, y + bh, pz - rd]],
                                    "#b23c2c", flood * (1 - i * 0.03) * 0.9));
          // the dark opening on the front of each storey, inset so it is a hole and not a stripe
          L(-bw * 0.34, y + bh * 0.18, bw * 0.34, y + bh * 0.76, -rd - 2, "#2a1712", 0.5);
          // the balcony: a projecting slab and a rail, on the front and both returns
          F([[px - bw * 1.06, y, pz - rd - 130], [px + bw * 1.06, y, pz - rd - 130],
             [px + bw * 1.06, y, pz - rd], [px - bw * 1.06, y, pz - rd]], "#2a1b16", flood * 0.6, 0.08);
          L(-bw * 1.06, y, bw * 1.06, y + 46, -rd - 130, "#7d3325", flood * 0.8);
          // The roof: four slopes to a short ridge, overhanging on every side, with the underside.
          const yr = y + bh, yt = yr + 150;
          F([[px - rw, yr, pz - rd - 180], [px + rw, yr, pz - rd - 180],
             [px + bw * 0.92, yt, pz - 20], [px - bw * 0.92, yt, pz - 20]], "#2f3543", flood * 0.78, 0.1);
          F([[px - rw, yr, pz + rd + 180], [px + rw, yr, pz + rd + 180],
             [px + bw * 0.92, yt, pz + 20], [px - bw * 0.92, yt, pz + 20]], "#272c38", flood * 0.6, 0.1);
          [-1, 1].forEach((sd) => F([[px + sd * rw, yr, pz - rd - 180], [px + sd * rw, yr, pz + rd + 180],
                                     [px + sd * bw * 0.92, yt, pz + 20], [px + sd * bw * 0.92, yt, pz - 20]],
                                    "#313846", flood * 0.7, 0.1));
          // the eave's underside: the band that makes a pagoda roof read as a roof from below
          F([[px - rw, yr, pz - rd - 180], [px + rw, yr, pz - rd - 180],
             [px + rw, yr, pz + rd + 180], [px - rw, yr, pz + rd + 180]], "#181c24", flood * 0.42, 0.04);
          // the eave's tip, curling up at the corners
          [-1, 1].forEach((sd) => F([[px + sd * rw, yr, pz - rd - 182], [px + sd * (rw + 44), yr + 56, pz - rd - 182],
                                     [px + sd * (rw - 90), yr + 40, pz - rd - 182]], "#4d5464", flood * 0.8));
          L(-rw, yr - 10, rw, yr + 10, pz - rd - 182, "#5a6170", flood * 0.8);
          y = yt;
        }
        // The sourin: mast, nine rings, and the finial at the record's 53.32 m.
        L(-18, y, 18, PH - 120, -20, "#5e5446", flood * 0.8);
        L(-18, y, 18, PH - 120, 20, "#4a4340", flood * 0.7);
        for (let r = 0; r < 9; r++) {
          const ry = y + 140 + r * ((PH - y - 420) / 9);
          L(-62, ry, 62, ry + 26, -30, "#8a7a54", flood * 0.9);
          L(-62, ry, 62, ry + 26, 30, "#6f6344", flood * 0.75);
        }
        L(-34, PH - 160, 34, PH, -20, "#a68c52", flood);
      }
    }
    /* The Kanmon Strait beyond the Moji table, at the table's own scale (round 32; TODO §0n): one
       model, from the quay to the far shore. The water runs from the table's far edge to the
       Shimonoseki shore; the Kaikyō Yume Tower stands on it (153 m, its glass sphere at 143 m),
       about 3 km west of the station; the Kanmon Bridge crosses to the north (1,068 m: a 712 m
       span between towers 141 m above the sea and 178 m side spans, the deck 61 m up, painted
       grey-green); and the strait's own traffic -- some 500 ships a day -- passes on the house
       clock. Positions are OpenStreetMap's, turned into the table's frame (the table looks
       north-west). The far shore's city is a band of low blocks: the sources give the city, not
       its buildings, and nothing out there is lettered. */
    const sq = bd.strait;
    if (sq) {
      const wy = sq.y, nightK = NIGHT();
      const S0 = (pts, col, l, air) => {
        const q = add(C, pts, new Array(pts.length * 2).fill(0), "flat", col, null);
        if (q) { q.lit = l; q.air = air === undefined ? 0.12 : air; q.day = false; }
        return q;
      };
      const STEP = 1200, PU = 1 / 10, span = Math.max(1, sq.z1 - sq.z0);
      for (let z = sq.z0; z < sq.z1; z += STEP) {
        const z1 = Math.min(z + STEP, sq.z1);
        const wq = add(C, [[-sq.half, wy, z], [sq.half, wy, z], [sq.half, wy, z1], [-sq.half, wy, z1]],
          [z * PU, -sq.half * PU, z * PU, sq.half * PU, z1 * PU, sq.half * PU, z1 * PU, -sq.half * PU],
          "pat", PATS.water, null);
        if (wq) { wq.lit = 0.8; wq.air = 0.08 + (((z + z1) / 2 - sq.z0) / span) * (FOG_MAX - 0.1); }
      }
      // Land: the Moji coast running north on the right, the Shimonoseki shore across the strait.
      const landStrip = (line, far, sideX) => {
        for (let i = 0; i < line.length - 1; i++) {
          const [ax0, az0] = line[i], [bx0, bz0] = line[i + 1];
          const pts = sideX
            ? [[ax0, wy + 1, az0], [bx0, wy + 1, bz0], [far, wy + 1, bz0], [far, wy + 1, az0]]
            : [[ax0, wy + 1, az0], [bx0, wy + 1, bz0], [bx0, wy + 1, bz0 + far], [ax0, wy + 1, az0 + far]];
          S0(pts, "#1b2333", 0.45, 0.2);
        }
      };
      if (sq.moji) landStrip(sq.moji, 9000, true);
      if (sq.shore) {
        landStrip(sq.shore, 4000, false);
        let n = 0;
        for (let i = 0; i < sq.shore.length - 1; i++) {
          const [ax0, az0] = sq.shore[i], [bx0, bz0] = sq.shore[i + 1];
          const L = Math.hypot(bx0 - ax0, bz0 - az0), cnt = Math.max(2, Math.round(L / 160));
          for (let j = 0; j < cnt; j++, n++) {
            const t = (j + 0.5) / cnt, cx = ax0 + (bx0 - ax0) * t, cz = az0 + (bz0 - az0) * t + 60;
            const h = 18 + ((n * 37) % 40), w = 70 + ((n * 53) % 60);
            S0([[cx - w / 2, wy + 1, cz], [cx + w / 2, wy + 1, cz], [cx + w / 2, wy + h, cz], [cx - w / 2, wy + h, cz]],
               mix("#2b3548", ((n % 3) - 1) * 0.06), 0.55, 0.22);
            if (nightK > 0.3) {
              for (let r = 1; r < Math.min(4, Math.floor(h / 9)); r++) {
                S0([[cx - w * 0.4, wy + r * 9, cz - 1], [cx + w * 0.4, wy + r * 9, cz - 1],
                    [cx + w * 0.4, wy + r * 9 + 2.5, cz - 1], [cx - w * 0.4, wy + r * 9 + 2.5, cz - 1]],
                   `rgba(255,214,150,${(0.35 * nightK).toFixed(3)})`, 1.2, 0.2);
              }
            }
          }
        }
      }
      // The Kaikyō Yume Tower: a slender shaft and the glass sphere near its head.
      const ym = sq.yume;
      if (ym) {
        S0([[ym.x - 9, wy, ym.z], [ym.x + 9, wy, ym.z], [ym.x + 7, wy + ym.sphere - ym.r, ym.z],
            [ym.x - 7, wy + ym.sphere - ym.r, ym.z]], "#8796a6", 0.7, 0.18);
        const sp = [];
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          sp.push([ym.x + Math.cos(a) * ym.r, wy + ym.sphere + Math.sin(a) * ym.r, ym.z - 1]);
        }
        S0(sp, nightK > 0.3 ? "#d9ecf6" : "#9fb6c6", nightK > 0.3 ? 1.4 : 0.8, 0.16);
        S0([[ym.x - 2, wy + ym.sphere + ym.r, ym.z], [ym.x + 2, wy + ym.sphere + ym.r, ym.z],
            [ym.x + 1, wy + ym.h, ym.z], [ym.x - 1, wy + ym.h, ym.z]], "#8796a6", 0.7, 0.18);
      }
      // The Kanmon Bridge: towers at the ends of the centre span, the deck, and the main cables.
      const kb = sq.kanmon;
      if (kb) {
        const [ax0, az0] = kb.a, [bx0, bz0] = kb.b, sd = kb.side || 178 / 1068;
        const at = (t) => [ax0 + (bx0 - ax0) * t, az0 + (bz0 - az0) * t];
        const dx = bx0 - ax0, dz = bz0 - az0, len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len;
        const halfW = kb.width || 19;
        const col = "#7f9488", dY = wy + kb.deck;
        S0([[ax0 - nx * halfW, dY, az0 - nz * halfW], [bx0 - nx * halfW, dY, bz0 - nz * halfW],
            [bx0 + nx * halfW, dY, bz0 + nz * halfW], [ax0 + nx * halfW, dY, az0 + nz * halfW]], col, 0.65, 0.2);
        S0([[ax0, dY - 4, az0], [bx0, dY - 4, bz0], [bx0, dY, bz0], [ax0, dY, az0]], mix(col, -0.25), 0.6, 0.2);
        [sd, 1 - sd].forEach((t) => {
          const [tx, tz] = at(t);
          [-1, 1].forEach((e) => S0([[tx + nx * e * halfW - 3, wy, tz + nz * e * halfW], [tx + nx * e * halfW + 3, wy, tz + nz * e * halfW],
                                     [tx + nx * e * halfW + 2, wy + kb.tower, tz + nz * e * halfW],
                                     [tx + nx * e * halfW - 2, wy + kb.tower, tz + nz * e * halfW]], col, 0.7, 0.18));
          S0([[tx - nx * halfW, wy + kb.tower - 8, tz - nz * halfW], [tx + nx * halfW, wy + kb.tower - 8, tz + nz * halfW],
              [tx + nx * halfW, wy + kb.tower - 2, tz + nz * halfW], [tx - nx * halfW, wy + kb.tower - 2, tz - nz * halfW]], col, 0.7, 0.18);
        });
        const cableY = (t) => {
          if (t < sd) return dY + (kb.tower - kb.deck) * (t / sd);
          if (t > 1 - sd) return dY + (kb.tower - kb.deck) * ((1 - t) / sd);
          const c = (t - 0.5) / (0.5 - sd);
          return dY + 6 + (kb.tower - kb.deck - 6) * c * c;
        };
        for (let i = 0; i < 24; i++) {
          const t0 = i / 24, t1 = (i + 1) / 24, [x0, z0] = at(t0), [x1, z1] = at(t1);
          S0([[x0, cableY(t0), z0], [x1, cableY(t1), z1], [x1, cableY(t1) + 1.6, z1], [x0, cableY(t0) + 1.6, z0]],
             mix(col, 0.1), 0.75, 0.18);
        }
      }
      // The strait's ships, on the house clock: a dark hull, the white house aft, lights after dark.
      (sq.ships || []).forEach((sh) => {
        const t = (((ease ? T : 0) / sh.period) + (sh.phase || 0)) % 1;
        const [fx, fz] = sh.from, [tx, tz] = sh.to;
        const x = fx + (tx - fx) * t, z = fz + (tz - fz) * t;
        const L = Math.hypot(tx - fx, tz - fz), ux = (tx - fx) / L, uz = (tz - fz) / L;
        const hl = sh.len / 2, hb = sh.len / 14, hh = sh.len / 12;
        const fade = Math.min(1, Math.min(t, 1 - t) * 8);
        const air = 0.1 + (1 - fade) * 0.5;
        const p = (a, b, y) => [x + ux * a - uz * b, wy + y, z + uz * a + ux * b];
        S0([p(-hl, -hb, 0), p(hl * 0.8, -hb, 0), p(hl * 0.8, -hb, hh), p(-hl, -hb, hh)], "#2a2f38", 0.7, air);
        S0([p(hl * 0.8, -hb, 0), p(hl, 0, 0), p(hl, 0, hh), p(hl * 0.8, -hb, hh)], "#262b33", 0.7, air);
        S0([p(-hl, -hb, hh), p(hl * 0.8, -hb, hh), p(hl, 0, hh), p(hl * 0.8, hb, hh), p(-hl, hb, hh)], "#5b6470", 0.7, air);
        S0([p(-hl * 0.92, -hb * 0.8, hh), p(-hl * 0.62, -hb * 0.8, hh), p(-hl * 0.62, -hb * 0.8, hh * 2.4),
            p(-hl * 0.92, -hb * 0.8, hh * 2.4)], "#e6e9ec", 0.8, air);
        if (nightK > 0.3) {
          S0([p(-hl * 0.9, -hb * 0.82, hh * 1.6), p(-hl * 0.64, -hb * 0.82, hh * 1.6), p(-hl * 0.64, -hb * 0.82, hh * 1.9),
              p(-hl * 0.9, -hb * 0.82, hh * 1.9)], `rgba(255,220,170,${(0.7 * nightK).toFixed(3)})`, 1.5, air);
          S0([p(hl * 0.5, -hb * 0.5, hh * 2.6), p(hl * 0.52, -hb * 0.5, hh * 2.6), p(hl * 0.52, -hb * 0.5, hh * 2.9),
              p(hl * 0.5, -hb * 0.5, hh * 2.9)], `rgba(255,252,240,${(0.9 * nightK).toFixed(3)})`, 1.6, air);
        }
      });
    }
    const plaza = bd.plaza;
    if (plaza) {
      /* The ground beyond the window is the one surface whose *scale* the lane's own rule cannot
         reach: an affine map is exact across a narrow panel and this plane is a hundred metres deep,
         so one quad would bend the paving the way a single stretched quad bends a wall — the same
         reason the lane's walls are 60 cm slices. It is also dressed at its own scale, one tile per
         8 m, because a 64 cm tile sixty metres away is smaller than a pixel and comes back as a
         shimmer nobody authored. Air is ramped with depth rather than fixed, so the far edge of the
         plaza dissolves into the sky the compound is set against. */
      const STEP = 1200, PU = 1 / 10;                     // panel depth, uv units per centimetre
      const span = Math.max(1, plaza.z1 - plaza.z0);
      for (let z = plaza.z0; z < plaza.z1; z += STEP) {
        const z1 = Math.min(z + STEP, plaza.z1);
        const fl = add(C, [[-plaza.half, plaza.y, z], [plaza.half, plaza.y, z],
                           [plaza.half, plaza.y, z1], [-plaza.half, plaza.y, z1]],
            [z * PU, -plaza.half * PU, z * PU, plaza.half * PU,
             z1 * PU, plaza.half * PU, z1 * PU, -plaza.half * PU],
            "pat", floorPat);
        // Air ramps toward the lane's own murk ceiling and never past it: the plaza is the one
        // surface whose far edge is allowed to dissolve into the sky, and FOG_MAX is what "far" is
        // defined as in this renderer. A hand-picked 0.65 here would be the renderer telling a
        // different story about distance than every other quad in the frame.
        if (fl) {
          fl.air = 0.2 + ((z - plaza.z0) / span) * (FOG_MAX - 0.2);
          // Authored bright for a night under the city's own glow, and dialled back where there is a
          // sun to do that job instead: a lit pavement plus a noon lift is white pavement.
          fl.daygain = 0.72;
        }
      }
    }
    /* A harbour, where the record asks for one: the street ends at a quay, and past the rail the
       water runs to a far shore. The water is panelled like the plaza — one stretched quad would
       bend the glints the way it bends paving — and it carries the day tile when the sun is up and
       the night tile when it is not, the swap hidden inside the same hour the air is already
       re-colouring everything. What floats on it is silhouette: a hull, a white house, a funnel,
       and the crane a working quay keeps. Nothing out there is lettered, and nothing out there
       lights the lane. */
    const hb = bd.harbor;
    if (hb) {
      const wtile = DAY() > 0.35 ? PATS.waterDay : PATS.water;
      const STEP = 1200, PU = 1 / 10, span = Math.max(1, hb.z1 - hb.z0);
      for (let z = hb.z0; z < hb.z1; z += STEP) {
        const z1 = Math.min(z + STEP, hb.z1);
        const wq = add(C, [[-hb.half, hb.y, z], [hb.half, hb.y, z],
                           [hb.half, hb.y, z1], [-hb.half, hb.y, z1]],
            [z * PU, -hb.half * PU, z * PU, hb.half * PU,
             z1 * PU, hb.half * PU, z1 * PU, -hb.half * PU],
            "pat", wtile);
        if (wq) {
          const depth = clamp((((z + z1) / 2) - hb.z0) / span, 0, 1);
          const band = Math.min(2, Math.floor(depth * 3));
          // Near, middle and far water keep different values under the same breaking tile; the far
          // band then meets the shore through authored air instead of ending as one blue rectangle.
          wq.air = 0.22 + depth * (FOG_MAX - 0.22);
          wq.lit = [0.62, 0.52, 0.42][band];
          wq.daygain = [1.0, 0.74, 0.52][band];
        }
      }
      // The sun's own column on the water: a pale reach of glint that only exists while the sun does.
      if (DAY() > 0.05) {
        const gx = sunAz() * 420;                    // the glint stands under the sun, not under the lens
        const g = add(C, [[gx - 240, hb.y + 2, hb.z0 + 300], [gx + 240, hb.y + 2, hb.z0 + 300],
                          [gx + 460, hb.y + 2, hb.z1], [gx - 460, hb.y + 2, hb.z1]],
                      ZERO8, "flat", `rgba(242,247,251,${(0.30 * DAY()).toFixed(3)})`);
        if (g) { g.air = 0.1; g.day = false; }
      }
      // The water keeps a wind on it even when nobody is walking. Three authored lanes of broken
      // glints drift down the basin; six rings expand from fixed points and fade instead of pulsing
      // in place. The scene's reduced-motion preference parks both systems on the painted tile.
      const motion = hb.motion;
      if (motion && !reduce()) {
        const travelSpan = Math.max(1, hb.z1 - hb.z0 - 600);
        const sunnyWater = DAY() > 0.2;
        (motion.lanes || []).forEach((lane, li) => {
          const travel = ((T * lane.speed + lane.offset) % travelSpan + travelSpan) % travelSpan;
          const count = Math.max(1, Math.min(10, Math.round(travelSpan / lane.spacing)));
          for (let i = 0; i < count; i++) {
            const z0 = hb.z0 + 300 + ((i * lane.spacing + travel) % travelSpan);
            const z1 = Math.min(z0 + 14, hb.z1 - 20);
            const len = lane.length * (0.72 + 0.28 * Math.sin(i * 1.73 + li));
            const cx = lane.x + Math.sin(T * 0.42 + i * 1.91 + li) * lane.spread;
            const x0 = clamp(cx - len / 2, -hb.half + 40, hb.half - len - 40);
            const alpha = (sunnyWater ? 0.16 : 0.11) * (0.82 + 0.18 * Math.sin(T + i));
            const streak = add(C, [[x0, hb.y + 2, z0], [x0 + len, hb.y + 2, z0],
                                   [x0 + len * 0.94, hb.y + 2, z1], [x0 + len * 0.06, hb.y + 2, z1]],
                              ZERO8, "flat", sunnyWater
                                ? `rgba(235,246,250,${alpha.toFixed(3)})`
                                : `rgba(119,155,188,${alpha.toFixed(3)})`);
            if (streak) {
              streak.sz = streak.z - 180;       // glint after its broad water panel, never under it
              streak.air = 0.08; streak.lit = 0.35; streak.daygain = 0.12;
            }
          }
        });
        (motion.ripples || []).forEach((r) => {
          const period = Math.max(0.1, r.period || 6);
          const age = (((T + (r.phase || 0)) % period) + period) % period / period;
          const outer = 34 + age * (r.max || 280), inner = Math.max(12, outer - 11);
          const alpha = 0.18 * (1 - age);
          if (alpha < 0.025) return;
          const color = sunnyWater
            ? `rgba(245,250,252,${alpha.toFixed(3)})`
            : `rgba(112,151,184,${(alpha * 0.78).toFixed(3)})`;
          const segments = 10;
          for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2, a1 = ((i + 1) / segments) * Math.PI * 2;
            const ring = add(C, [
              [r.x + Math.cos(a0) * inner, hb.y + 2, r.z + Math.sin(a0) * inner],
              [r.x + Math.cos(a0) * outer, hb.y + 2, r.z + Math.sin(a0) * outer],
              [r.x + Math.cos(a1) * outer, hb.y + 2, r.z + Math.sin(a1) * outer],
              [r.x + Math.cos(a1) * inner, hb.y + 2, r.z + Math.sin(a1) * inner],
            ], ZERO8, "flat", color);
            if (ring) {
              ring.sz = ring.z - 180;           // put the fine surface detail above the water tile
              ring.air = 0.08; ring.lit = 0.28; ring.daygain = 0.1;
            }
          }
        });
      }

      const slip = hb.slipway;
      const quayY = plaza ? plaza.y : 0;
      // The front of a quay is a wall, not a missing strip between pavement and sea. Leave a real
      // opening where the four-step slipway reaches the water; the ladder sits on the adjacent face.
      const quayRuns = slip
        ? [[-hb.half, slip.x - slip.width / 2], [slip.x + slip.width / 2, hb.half]]
        : [[-hb.half, hb.half]];
      quayRuns.forEach(([x0, x1]) => {
        if (x1 - x0 < 1) return;
        const face = add(C, [[x0, hb.y, hb.z0], [x1, hb.y, hb.z0],
                             [x1, quayY, hb.z0], [x0, quayY, hb.z0]],
                         ZERO8, "flat", "#657487");
        if (face) { face.air = 0.12; face.lit = 0.48; face.daygain = 0.3; }
      });
      if (slip) {
        const steps = Math.max(2, Math.min(8, Math.round(slip.steps || 4)));
        const run = (slip.z1 - slip.z0) / steps, rise = (slip.y0 - slip.y1) / steps;
        const x0 = slip.x - slip.width / 2, x1 = slip.x + slip.width / 2;
        for (let i = 0; i < steps; i++) {
          const z0 = slip.z0 + i * run, z1 = slip.z0 + (i + 1) * run;
          const y0 = slip.y0 - i * rise, y1 = slip.y0 - (i + 1) * rise;
          const tread = add(C, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
                            ZERO8, "flat", i % 2 ? "#a5adb3" : "#b4bbc0");
          if (tread) { tread.air = 0.1; tread.lit = 0.52; tread.daygain = 0.32; }
          const riser = add(C, [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]],
                            ZERO8, "flat", "#647386");
          if (riser) { riser.air = 0.1; riser.lit = 0.44; riser.daygain = 0.28; }
        }
      }
      const ladder = hb.ladder;
      if (ladder) {
        const half = ladder.width / 2, railColor = "#37465a";
        [-1, 1].forEach((side) => {
          const lx = ladder.x + side * (half - 5);
          const rail = add(C, [[lx - 3, ladder.y0, ladder.z], [lx + 3, ladder.y0, ladder.z],
                               [lx + 3, ladder.y1, ladder.z], [lx - 3, ladder.y1, ladder.z]],
                           ZERO8, "flat", railColor);
          if (rail) { rail.air = 0.12; rail.lit = 0.42; rail.daygain = 0.28; }
        });
        const rungs = Math.max(2, Math.min(12, Math.round(ladder.rungs || 6)));
        for (let i = 1; i <= rungs; i++) {
          const y = ladder.y0 + ((ladder.y1 - ladder.y0) * i) / (rungs + 1);
          const rung = add(C, [[ladder.x - half, y - 2, ladder.z], [ladder.x + half, y - 2, ladder.z],
                               [ladder.x + half, y + 2, ladder.z], [ladder.x - half, y + 2, ladder.z]],
                           ZERO8, "flat", "#8797a7");
          if (rung) { rung.air = 0.1; rung.lit = 0.48; rung.daygain = 0.28; }
        }
      }
      const bollards = hb.bollards;
      if (bollards) {
        const spacing = Math.max(100, bollards.spacing || 600);
        for (let px = bollards.x0; px <= bollards.x1; px += spacing) {
          const stem = add(C, [[px - 11, quayY, bollards.z], [px + 11, quayY, bollards.z],
                               [px + 11, quayY + 48, bollards.z], [px - 11, quayY + 48, bollards.z]],
                           ZERO8, "flat", "#344257");
          if (stem) { stem.air = 0.1; stem.lit = 0.42; stem.daygain = 0.36; }
          const head = add(C, [[px - 27, quayY + 43, bollards.z - 4], [px + 27, quayY + 43, bollards.z - 4],
                               [px + 27, quayY + 55, bollards.z - 4], [px - 27, quayY + 55, bollards.z - 4]],
                           ZERO8, "flat", "#2a3548");
          if (head) { head.air = 0.1; head.lit = 0.4; head.daygain = 0.34; }
        }
      }
      // A distant, broken row of interlocking blocks keeps the waterline from ending as a ruler.
      (hb.breakwater || []).forEach((block, i) => {
        const x = block.x, w = block.w, y = hb.y + 1, h = block.h;
        const profile = [
          [x - w / 2, y, block.z], [x + w / 2, y, block.z],
          [x + w * 0.46, y + h * 0.52, block.z], [x + w * 0.16, y + h, block.z],
          [x - w * 0.18, y + h * 0.76, block.z], [x - w / 2, y + h * 0.36, block.z],
        ];
        const rock = add(C, profile, new Array(profile.length * 2).fill(0), "flat",
                         i % 2 ? "#526374" : "#596b79");
        if (rock) { rock.sz = rock.z - 160; rock.air = 0.2; rock.lit = 0.38; rock.daygain = 0.26; }
      });

      // The quay's rail is three lines on each side of the access cut, with regular posts. The gap
      // is not a missing rail by accident: the steps and the hole in the seawall are one continuous
      // route from the paving down to the water.
      // against the water. It is the edge of the walkable world, so it is the one thing out there
      // drawn at the lane's own contrast.
      const ry = hb.rail !== undefined ? hb.rail : hb.z0 - 60;
      const railHalf = hb.half * 0.6;
      const gapHalf = slip ? slip.width / 2 + 18 : 0;
      const railRuns = slip
        ? [[-railHalf, slip.x - gapHalf], [slip.x + gapHalf, railHalf]]
        : [[-railHalf, railHalf]];
      [[62, 5], [40, 4]].forEach(([yy, th]) => {
        railRuns.forEach(([x0, x1]) => {
          const q = add(C, [[x0, yy, ry], [x1, yy, ry],
                            [x1, yy + th, ry], [x0, yy + th, ry]],
                        ZERO8, "flat", "#20293c");
          if (q) { q.air = 0.16; q.lit = 0.5; q.daygain = 0.6; }
        });
      });
      for (let px = -railHalf; px <= railHalf; px += 220) {
        if (slip && Math.abs(px - slip.x) < gapHalf + 10) continue;
        const q = add(C, [[px - 3, 0, ry], [px + 3, 0, ry], [px + 3, 66, ry], [px - 3, 66, ry]],
                      ZERO8, "flat", "#20293c");
        if (q) { q.air = 0.16; q.lit = 0.5; q.daygain = 0.6; }
      }
      // A ferry at moor, with a sheer line to its bow, a distinct cabin, roof, windows and funnel.
      // At distance it is still one readable silhouette, not a pair of bars lying on the water.
      (hb.ships || []).forEach((sh) => {
        const dl = DAY(), half = sh.l / 2;
        const profile = [
          [sh.x - half, hb.y + 68, sh.z], [sh.x - half + 82, hb.y + 24, sh.z],
          [sh.x + half - 150, hb.y + 24, sh.z], [sh.x + half, hb.y + 50, sh.z],
          [sh.x + half - 68, hb.y + 88, sh.z], [sh.x - half + 180, hb.y + 88, sh.z],
        ];
        const hull = add(C, profile, new Array(profile.length * 2).fill(0), "flat", sh.hull || "#232c40");
        if (hull) { hull.air = 0.14; hull.lit = 0.4 + 0.5 * dl; hull.daygain = 0.7; }
        const line = add(C, [[sh.x - half + 130, hb.y + 30, sh.z - 1],
                             [sh.x + half - 170, hb.y + 30, sh.z - 1],
                             [sh.x + half - 200, hb.y + 36, sh.z - 1],
                             [sh.x - half + 115, hb.y + 36, sh.z - 1]],
                         ZERO8, "flat", dl > 0.2 ? "#9fb8c2" : "#657b91");
        if (line) { line.air = 0.12; line.lit = 0.45; line.daygain = 0.28; }
        const hx0 = sh.x - sh.l * 0.36, hx1 = sh.x + sh.l * 0.19;
        const house = add(C, [[hx0, hb.y + 88, sh.z], [hx1, hb.y + 88, sh.z],
                              [hx1, hb.y + 148, sh.z], [hx0, hb.y + 148, sh.z]],
                          ZERO8, "flat", sh.house || "#c9cfd8");
        if (house) { house.air = 0.14; house.lit = 0.5 + 0.5 * dl; house.daygain = 0.7; }
        const roof = add(C, [[hx0 - 12, hb.y + 148, sh.z], [hx1 + 12, hb.y + 148, sh.z],
                             [hx1 + 6, hb.y + 157, sh.z], [hx0 - 6, hb.y + 157, sh.z]],
                         ZERO8, "flat", "#e0e3df");
        if (roof) { roof.air = 0.13; roof.lit = 0.52; roof.daygain = 0.6; }
        const panes = Math.max(3, Math.min(10, Math.round(sh.windows || 6)));
        const paneSpan = (hx1 - hx0) * 0.78, paneLeft = (hx0 + hx1 - paneSpan) / 2;
        for (let i = 0; i < panes; i++) {
          const px = paneLeft + ((i + 0.5) / panes) * paneSpan;
          const ww = Math.min(34, paneSpan / (panes * 1.7));
          const win = add(C, [[px - ww / 2, hb.y + 108, sh.z - 1], [px + ww / 2, hb.y + 108, sh.z - 1],
                              [px + ww / 2, hb.y + 127, sh.z - 1], [px - ww / 2, hb.y + 127, sh.z - 1]],
                          ZERO8, "flat", dl > 0.2 ? "#557c90" : "#ffd9a0");
          if (win) {
            win.air = 0.1; win.lit = dl > 0.2 ? 0.34 : 1.5; win.daygain = 0.12;
            if (dl <= 0.2) win.nolite = true;
          }
        }
        const fx = sh.x + sh.l * 0.02;
        const fun = add(C, [[fx - 14, hb.y + 157, sh.z], [fx + 14, hb.y + 157, sh.z],
                            [fx + 14, hb.y + 196, sh.z], [fx - 14, hb.y + 196, sh.z]],
                        ZERO8, "flat", sh.funnel || "#8a4a3c");
        if (fun) { fun.air = 0.14; fun.lit = 0.45 + 0.45 * dl; fun.daygain = 0.7; }
        const mast = add(C, [[sh.x - 3, hb.y + 157, sh.z], [sh.x + 3, hb.y + 157, sh.z],
                             [sh.x + 3, hb.y + 214, sh.z], [sh.x - 3, hb.y + 214, sh.z]],
                         ZERO8, "flat", "#596b7c");
        if (mast) { mast.air = 0.14; mast.lit = 0.4; mast.daygain = 0.32; }
      });
      // The crane: two legs, a beam, a jib reaching over the water. A silhouette at any hour — a
      // crane has no lit face anyone remembers.
      (hb.cranes || []).forEach((cr) => {
        const col = "#26304a";
        const leg = (lx) => {
          const q = add(C, [[lx - 6, hb.y + 20, cr.z], [lx + 6, hb.y + 20, cr.z],
                            [lx + 6, hb.y + 300, cr.z], [lx - 6, hb.y + 300, cr.z]],
                        ZERO8, "flat", col);
          if (q) { q.air = 0.16; q.lit = 0.42; q.daygain = 0.55; }
        };
        leg(cr.x - 78); leg(cr.x + 78);
        const beam = add(C, [[cr.x - 112, hb.y + 300, cr.z], [cr.x + 112, hb.y + 300, cr.z],
                             [cr.x + 112, hb.y + 322, cr.z], [cr.x - 112, hb.y + 322, cr.z]],
                         ZERO8, "flat", col);
        if (beam) { beam.air = 0.16; beam.lit = 0.42; beam.daygain = 0.55; }
        const jib = add(C, [[cr.x - 20, hb.y + 322, cr.z], [cr.x + 250, hb.y + 396, cr.z],
                            [cr.x + 250, hb.y + 408, cr.z], [cr.x - 20, hb.y + 340, cr.z]],
                        ZERO8, "flat", col);
        if (jib) { jib.air = 0.16; jib.lit = 0.42; jib.daygain = 0.55; }
        const trolley = add(C, [[cr.x + 122, hb.y + 374, cr.z - 1], [cr.x + 158, hb.y + 384, cr.z - 1],
                                [cr.x + 158, hb.y + 399, cr.z - 1], [cr.x + 122, hb.y + 389, cr.z - 1]],
                           ZERO8, "flat", "#3a4659");
        if (trolley) { trolley.air = 0.14; trolley.lit = 0.42; trolley.daygain = 0.45; }
        const hoist = add(C, [[cr.x + 137, hb.y + 205, cr.z - 2], [cr.x + 143, hb.y + 205, cr.z - 2],
                              [cr.x + 143, hb.y + 380, cr.z - 2], [cr.x + 137, hb.y + 380, cr.z - 2]],
                         ZERO8, "flat", "#536174");
        if (hoist) { hoist.air = 0.13; hoist.lit = 0.4; hoist.daygain = 0.34; }
        const hook = add(C, [[cr.x + 124, hb.y + 184, cr.z - 2], [cr.x + 156, hb.y + 184, cr.z - 2],
                             [cr.x + 156, hb.y + 210, cr.z - 2], [cr.x + 124, hb.y + 210, cr.z - 2]],
                         ZERO8, "flat", "#687687");
        if (hook) { hook.air = 0.13; hook.lit = 0.42; hook.daygain = 0.34; }
      });
    }
    const cross = bd.crossing;
    if (cross) {
      const n = cross.stripes || 8, span = cross.x1 - cross.x0;
      for (let i = 0; i < n; i++) {
        const z = cross.z0 + ((i + 0.5) / n) * (cross.z1 - cross.z0);
        const q = add(C, [[cross.x0, cross.y + 1, z - cross.width / 2],
                          [cross.x1, cross.y + 1, z - cross.width / 2],
                          [cross.x1, cross.y + 1, z + cross.width / 2],
                          [cross.x0, cross.y + 1, z + cross.width / 2]],
                      ZERO8, "flat", "#c7d3e8", null);
        if (q) { q.air = 0.18; q.lit = 0.72; q.daygain = 0.5; }
      }
      if (cross.diagonals) {
        // The scramble's own gesture: bands running along the crossing as well as across it, so the
        // ground reads as somewhere people converge from every corner, not a single zebra.
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const cx = cross.x0 + span * t;
          const cz = cross.z0 + (cross.z1 - cross.z0) * t;
          const q = add(C, [[cx - cross.width / 2, cross.y + 1, cz - cross.width / 2],
                            [cx + cross.width / 2, cross.y + 1, cz - cross.width / 2],
                            [cx + cross.width / 2, cross.y + 1, cz + cross.width / 2],
                            [cx - cross.width / 2, cross.y + 1, cz + cross.width / 2]],
                        ZERO8, "flat", "#b9c7de", null);
          if (q) { q.air = 0.2; q.lit = 0.62; q.daygain = 0.5; }
        }
      }
    }
    /* A window is a window. The tile carries an 8x8 grid of them, so the only fact a facade needs is
       how wide one cell is — 1.6 m, which puts five or six across a nine metre block. The scale used to
       be `0.5 + win` *interpreted as uv units per centimetre*, which is ~40 windows on the same facade:
       at 29 m that is two pixels per window, and the whole compound came back as television static.
       `win` is the share of the block that is lit, so it moves the brightness, not the grid. */
    const CELL_CM = 160, WINU = 16 / CELL_CM;
    (bd.city || []).forEach((b) => {
      const hw = b.w / 2, k = WINU, glow = (0.3 + (b.win || 0.4) * 0.4) * (b.tone === undefined ? 1 : b.tone);
      const face = add(C, [[b.x - hw, 0, b.z], [b.x + hw, 0, b.z], [b.x + hw, b.h, b.z],
                           [b.x - hw, b.h, b.z]],
          [(b.x - hw) * k, 0, (b.x + hw) * k, 0, (b.x + hw) * k, -b.h * k, (b.x - hw) * k, -b.h * k],
          "pat", winPat, null);
      if (face) { face.air = 0.14; face.lit = glow * (DAYPAGE ? 1 - 0.55 * DAY() : 1); face.daygain = 0.45; }
      const side = b.x < 0 ? 1 : -1;
      const sf = add(C, [[b.x + side * hw, 0, b.z - hw], [b.x + side * hw, 0, b.z + hw],
                          [b.x + side * hw, b.h, b.z + hw], [b.x + side * hw, b.h, b.z - hw]],
          [(b.z - hw) * k, 0, (b.z + hw) * k, 0, (b.z + hw) * k, -b.h * k, (b.z - hw) * k, -b.h * k],
          "pat", winPat, null);
      if (sf) { sf.air = 0.14; sf.lit = glow * 0.66 * (DAYPAGE ? 1 - 0.55 * DAY() : 1); sf.daygain = 0.45; }
      const lip = add(C, [[b.x - hw, b.h, b.z], [b.x + hw, b.h, b.z], [b.x + hw, b.h, b.z - 40],
                          [b.x - hw, b.h, b.z - 40]], ZERO8, "flat", "#0f1727", null);
      if (lip) lip.air = 0.1;
    });
    /* A nearer row of rooftops, flanking the crossing rather than standing on it: the first thing the
       aperture shows should be a silhouette at the height a lane sees roofs, because a lane that opened
       straight onto eight-storey facades would read as a diagram of a city rather than a view of one.
       They carry their own tone, so a low-rise row is not eight photocopies of one block. */
    (bd.roofs || []).forEach((r) => {
      const hw = r.w / 2, y0 = r.y || 0, tone = 0.34 + (r.tone === undefined ? 0.4 : r.tone * 0.6);
      const face = add(C, [[r.x - hw, y0, r.z], [r.x + hw, y0, r.z],
                           [r.x + hw, y0 + r.h, r.z], [r.x - hw, y0 + r.h, r.z]],
          ZERO8, "flat", "#1d2740");
      if (face) { face.air = 0.1; face.lit = tone; face.daygain = 0.55; }
      const eave = add(C, [[r.x - hw, y0 + r.h, r.z], [r.x + hw, y0 + r.h, r.z],
                           [r.x + hw, y0 + r.h, r.z - 140], [r.x - hw, y0 + r.h, r.z - 140]],
          ZERO8, "flat", "#2b3752");
      if (eave) { eave.air = 0.08; eave.lit = tone * 1.5; eave.daygain = 0.55; }   // the edge the sky can still reach
    });
    /* And a raised road crossing the whole view, above the crossing below it: the one piece of
       infrastructure that says "this city is bigger than this window". The lane's own rule holds out
       here too — the deck, its piers and the row of lamps along it are all authored numbers, and those
       lamps are geometry rather than light sources, because nothing out there may light the lane. */
    const ex = bd.express;
    if (ex) {
      const thick = ex.thick || 160, depth = ex.depth || 900, ground = ex.ground === undefined ? -260 : ex.ground;
      const deck = add(C, [[-ex.half, ex.y, ex.z], [ex.half, ex.y, ex.z],
                           [ex.half, ex.y + thick, ex.z], [-ex.half, ex.y + thick, ex.z]],
          ZERO8, "flat", "#39445c");
      if (deck) { deck.air = 0.16; deck.lit = 0.34; deck.daygain = 0.5; }
      const under = add(C, [[-ex.half, ex.y, ex.z], [ex.half, ex.y, ex.z],
                            [ex.half, ex.y, ex.z + depth], [-ex.half, ex.y, ex.z + depth]],
          ZERO8, "flat", "#1b2338");
      if (under) { under.air = 0.2; under.lit = 0.2; }
      (ex.lamps || []).forEach((lx) => {
        const lamp = add(C, [[lx - 46, ex.y + thick - 74, ex.z - 1], [lx + 46, ex.y + thick - 74, ex.z - 1],
                             [lx + 46, ex.y + thick - 34, ex.z - 1], [lx - 46, ex.y + thick - 34, ex.z - 1]],
            ZERO8, "flat", "rgba(255,226,178,0.72)");
        if (lamp) { lamp.air = 0.1; lamp.lit = 1.1; }
      });
      (ex.piers || []).forEach((px) => {
        const pw = (ex.pier || 220) / 2;
        const pier = add(C, [[px - pw, ground, ex.z], [px + pw, ground, ex.z],
                             [px + pw, ex.y, ex.z], [px - pw, ex.y, ex.z]],
            ZERO8, "flat", "#2a3247");
        if (pier) { pier.air = 0.18; pier.lit = 0.26; }
      });
    }
  };

  const draw = () => {
    T = (window.performance && performance.now ? performance.now() : Date.now()) / 1000;
    /* The lid over the lane: night sky, or the sky this place actually has.

       It is painted per panel, so colouring it by the panel's own depth gives a gradient in the one
       direction a visitor looks — deeper overhead and at your feet, paler toward the far end, which is
       where a sky's horizon is when you are standing in a street. Blended by how high the sun is
       rather than switched, because a sky that changes colour in one frame is a light being switched
       on, and the sun is not a switch.

       The lift above is skipped for this quad (`day: false`): the sky is not a lit surface, it is
       what the light comes out of, and adding the sun's colour to the sky makes the sky white. */
    const lidAt = (z) => {
      if (!DAYPAGE) return "#232f4a";
      const d = DAY();
      if (d <= 0.01) return "#232f4a";
      const t = clamp((z - Z_BACK) / Math.max(1, Z_FAR - Z_BACK), 0, 1);
      // Deep overhead, pale toward the far end, which is where the horizon is when you are standing
      // in a street. Two named blues rather than `mix`, because `mix` would push it toward warm white
      // and a sky washes out long before it goes white.
      return blendHex("#232f4a", blendHex("#4a76ba", "#cfe2f2", 0.10 + 0.70 * t), d);
    };
    // Recomputed per frame, not per resize: − / + are a field-of-view control, so the projection
    // has to answer them, and only the surface it is drawn on belongs to the device.
    const half = clamp(0.6 / zoom, 0.34, 0.92);
    focal = W * 0.5 / Math.tan(half);
    const C = cam();
    // Quads are staged in the scene's world coordinates below; the Three.js pass runs only after
    // every shell, prop, backdrop and state-driven surface has been rebuilt for this camera.
    quads.length = 0;
    // Whether the authored bands tile a panel's whole height: if they do, the wall's own tiling is
    // not painted at all, because the cladding will be. Anything less than full coverage keeps it, so
    // a half-dressed wall shows plaster behind the shutter rather than the void.
    const cladCovers = (side, z0, z1) => {
      const rows = surfaces.filter((sc) => sc.side === side && sc.z0 < z1 && sc.z1 > z0).sort((a, b) => a.y0 - b.y0);
      let y = 0;
      /* Round 59: "covers the wall" had to mean *covers the wall*, and 20 cm was enough to stop it.

         Every parapet in the record is authored to 400 cm and every lane's ceiling is 420, so a
         band set that ends at the top of the parapet left twenty centimetres of uncovered wall —
         and one uncovered centimetre is all this test needs to decide the *whole* panel is bare and
         paint the lane's default plaster over it, parapet and gorge included. That is the beige
         wall standing behind the Table Rock rail in every frame from the brink: the bands were
         right, the air above the iron was authored `open`, and the wall was painted anyway because
         of the gap between the parapet's height and the ceiling's. A hand's breadth is the
         tolerance; anything shorter than that is not a wall a visitor can see. */
      const TOP = WALL_TOP - 24;
      for (const r of rows) {
        if (r.y0 > y + 0.01) break;
        if (r.y1 > y) y = r.y1;
        if (y >= TOP) return true;
      }
      return y >= TOP;
    };
    /* Holes in the floor (round 33): a glass floor is a window, so where one lies the floor is not
       painted and the surveyed world under it shows through -- only on a page that has a world to
       show. What you see through it is whatever the camera's own angle reaches: the walk cannot
       pitch past 24 degrees, so the glass shows the ground a few hundred metres out, which is what
       the same glass shows a visitor whose head is where this camera is. */
    const holes = bd && bd.world
      ? meta.filter((m) => kindOf(m.kind) === "glassfloor")
            .map((m) => ({ x0: m.x - m.w / 2, x1: m.x + m.w / 2, z0: m.z - m.d / 2, z1: m.z + m.d / 2 }))
      : [];
    const floorPiece = (x0, x1, za, zb, zc) => {
      if (x1 - x0 < 1 || zb - za < 1) return;
      const fd = Math.abs(zc - C.z);
      const corners = [[x0, 0, za], [x1, 0, za], [x1, 0, zb], [x0, 0, zb]];
      /* Round 61: the floor does not go flat at sixteen metres.

         It did — `fd >= 1600` drew one untextured quad of the pavers' mean, on the argument that a
         distant paving stone is not worth a fill. On a promenade whose walk is 43 m that argument
         held. On Clifton Hill it is 103 m of plaza with the SkyWheel, a carousel, two rows of
         booths and six blocks standing on it, and the whole of it past sixteen metres was one flat
         grey field: the district read as a car park with rides parked in it. The tile is mipmapped,
         so the pave at 60 m costs a filtered tap and reads as paving; the measured mean is kept only
         for the far end of the lane, where a cell is a few pixels and the tile would be its mean
         anyway — 52 m, not 16.

         Round 64: the tile's period is the floor's own (FLOOR_PERIOD), and the far tier's flat
         colour is the tile's mean measured in the tile's own space — the flat quad's colour is not
         tone-mapped the way a canvas is, so it has to be authored at the value the canvas already
         carries, or the plaza wears a step at fifty-two metres. */
      const per = FLOOR_PERIOD[layer.dataset.floor] || 1;
      const k = DPM / per;
      const fl = floorTiers && fd >= 5200
        ? add(C, corners, ZERO8, "flat", "#9c9c96")          // the pavers' measured mean
        : add(C, corners, [za * k, x0 * k, za * k, x1 * k, zb * k, x1 * k, zb * k, x0 * k],
              "pat", floorTiers && fd >= 900 ? floorTiers[fd >= 2600 ? 1 : 0] : floorPat);
      /* Round 61: the paving is not a light source.
         A 1.15 lift on a tile already painted at 180 grey, under a sky-bright hemisphere, clipped
         the whole plaza to (212,227,236) — a white field with the rides standing in it, which is
         what the fun strip read as from its own station. The lift is for the promenade's stone,
         where the sun lands square; a 100 m plaza keeps its own value and shows its joints. */
      if (fl) { fl.lit = lightAt((x0 + x1) / 2, 6, zc) * (Math.abs(zc - C.z) > 2600 ? 0.82 : 1.05);
                fl.air = groundAir(fl.z, C.z);
                fl.sz = fl.z + 4000;     // the ground paints before anything standing on it
                if (UNDER) fl.nolite = true; }
    };
    // The lid, in whatever the place's ceiling is made of. A #hex is a flat colour, a PATS key is a
    // tile at the lid's own scale; absent, the street's sky (or night) as before.
    const lidPat = LID && LID[0] !== "#" ? PATS[LID] : null;
    const lidFlat = LID && LID[0] === "#" ? LID : null;
    const lidQuad = (pts, za, zb, zc, ya) => {
      const q = lidPat
        ? add(C, pts, [za * DPM, pts[0][0] * DPM, za * DPM, pts[1][0] * DPM,
                       zb * DPM, pts[2][0] * DPM, zb * DPM, pts[3][0] * DPM], "pat", lidPat)
        : add(C, pts, ZERO8, "flat", lidFlat || lidAt(zc));
      if (q) {
        q.lit = LID ? lightAt(0, ya, zc) * 0.95 : AMBIENT * 0.8;
        if (LID) q.day = false;          // a ceiling is under a roof: the sun does not land on it
        if (UNDER) q.nolite = true;
        q.sz = q.z + 4000;
      }
      return q;
    };
    /* The barrel: K chords of a circular segment from one springing line to the other, rising VAULT
       at the crown. Four chords read as a vault at a tunnel's width without asking for a curve. */
    const VK = 4;
    const vaultY = (k) => {
      const half = WALL, rise = VAULT;
      const R = (half * half + rise * rise) / (2 * rise), cy = WALL_TOP + rise - R;
      const a0 = Math.asin(half / R), a = -a0 + (2 * a0 * k) / VK;
      return [R * Math.sin(a), cy + R * Math.cos(a)];
    };
    for (let z = Z_BACK; z < Z_FAR; z += SEG) {
      const z1 = Math.min(z + SEG, Z_FAR);
      const zc = (z + z1) / 2;
      // round 52: the lane's half is per-slice (the plaza widens the corridor where the place does)
      const W = halfAt(zc);
      [-1, 1].forEach((side) => {
        if (surfaces.length && cladCovers(side, z, z1)) return;
        const px = side * W;
        const q = add(C, [[px, 0, z], [px, 0, z1], [px, WALL_TOP, z1], [px, WALL_TOP, z]],
                      [z * DPM, 0, z1 * DPM, 0, z1 * DPM, -WALL_TOP * DPM, z * DPM, -WALL_TOP * DPM],
                      "pat", (WALLMAT && PATS[WALLMAT]) || tilePat);
        // Side and span ride along so a door in this wall can paint after the slices behind it.
        if (q) { q.lit = lightAt(px, 210, zc); q.wall = side; q.za = z; q.zb = z1; if (UNDER) q.nolite = true; }
      });
      const hole = holes.find((h) => h.z0 < z1 && h.z1 > z);
      const P = pavedAt(zc);            // what is paved: the walk, or the square's whole floor
      if (!hole) floorPiece(-P, P, z, z1, zc);
      else {
        const ha = Math.max(z, hole.z0), hb = Math.min(z1, hole.z1);
        floorPiece(-P, P, z, ha, zc);
        floorPiece(-P, Math.max(-P, hole.x0), ha, hb, zc);
        floorPiece(Math.min(P, hole.x1), P, ha, hb, zc);
        floorPiece(-P, P, hb, z1, zc);
      }
      if (VAULT && !OPEN) {
        for (let k = 0; k < VK; k++) {
          const [xa, ya] = vaultY(k), [xb, yb] = vaultY(k + 1);
          lidQuad([[xa, ya, z], [xb, yb, z], [xb, yb, z1], [xa, ya, z1]], z, z1, zc, (ya + yb) / 2);
        }
      }
      const cl = OPEN || VAULT ? null : lidQuad([[-W, CEIL, z], [W, CEIL, z], [W, CEIL, z1], [-W, CEIL, z1]], z, z1, zc, CEIL);
      if (cl && !LID) cl.lit = AMBIENT * 0.8;   // out of the bulbs' reach, and it should look that way
    }
    /* The wall the lane runs into is the largest single surface in the deepest frame, and it was the
       lane's default tile: a pale grid with nothing in it, which read as the page having run out rather
       than as a wall. It is board-formed concrete now, the same material as the far half of the side
       walls — the face is at Z_FAR and dead ahead of the camera, so one affine map covers it exactly,
       and the pour seams and tie holes give the paint the scale the aperture is read against. */
    const wallPiece = (x0, y0, x1, y1, at) => {
      const q = add(C, [[x0, y0, Z_FAR], [x1, y0, Z_FAR], [x1, y1, Z_FAR], [x0, y1, Z_FAR]],
          [x0 * DPM, -y0 * DPM, x1 * DPM, -y0 * DPM, x1 * DPM, -y1 * DPM, x0 * DPM, -y1 * DPM],
          "pat", (WALLMAT && PATS[WALLMAT]) || concretePat);
      if (q) q.lit = at;
      return q;
    };
    if (OPEN_END) {
      /* No end wall (round 33): a promenade does not stop at a wall, and a wall there with a hole
         in it was a picture frame round the falls. The walk limit (`max_d`) is the only edge. */
    } else if (vista) {
      // Four pieces around the opening, plus jambs and a sill: a hole in a wall has a reveal, and
      // without one the vista reads as a decal of a window rather than a route out of the room.
      const vx0 = Math.max(-W, vista.x - vista.w / 2), vx1 = Math.min(W, vista.x + vista.w / 2);
      wallPiece(-W, 0, W, vista.y0, lightAt(0, 40, Z_FAR));
      wallPiece(-W, vista.y1, W, CEIL, lightAt(0, 380, Z_FAR));
      wallPiece(-W, vista.y0, vx0, vista.y1, lightAt(-300, 210, Z_FAR));
      wallPiece(vx1, vista.y0, W, vista.y1, lightAt(300, 210, Z_FAR));
      const deep = 26;
      [vx0, vx1].forEach((ex) => {
        const q = add(C, [[ex, vista.y0, Z_FAR], [ex, vista.y0, Z_FAR - deep],
                          [ex, vista.y1, Z_FAR - deep], [ex, vista.y1, Z_FAR]],
                      ZERO8, "flat", mix("#465572", -0.16));
        if (q) q.lit = lightAt(ex * 0.6, 210, Z_FAR) * 1.2;
      });
      /* The bottom of the opening is a parapet, not a hole: the camera stands above its lip, so the
         reveal's top face is the one surface of the whole end wall seen from above. A pale grey there
         read as the wall continuing round a corner. It is a galvanised coping — the one piece of the
         lane the weather actually runs off — and it is the brightest line in the frame on purpose,
         because it is the edge you stand at and the line the city is measured against. */
      const sill = add(C, [[vx0, vista.y0, Z_FAR], [vx1, vista.y0, Z_FAR],
                           [vx1, vista.y0, Z_FAR - deep], [vx0, vista.y0, Z_FAR - deep]],
                       [vx0 * DPM, vista.y0 * DPM, vx1 * DPM, vista.y0 * DPM,
                        vx1 * DPM, (vista.y0 - deep) * DPM, vx0 * DPM, (vista.y0 - deep) * DPM],
                       "pat", galvPat);
      if (sill) sill.lit = lightAt(0, 120, Z_FAR) * 1.5;
      // A glazed end (round 33, the LookOut): the opening is a window wall, mullion every `pitch`.
      if (vista.pitch) {
        for (let mx = vx0 + vista.pitch; mx < vx1 - 4; mx += vista.pitch) {
          const mq = add(C, [[mx - 3.5, vista.y0, Z_FAR - 1], [mx + 3.5, vista.y0, Z_FAR - 1],
                             [mx + 3.5, vista.y1, Z_FAR - 1], [mx - 3.5, vista.y1, Z_FAR - 1]], ZERO8, "flat", "#1b2029");
          if (mq) { mq.lit = lightAt(mx, 150, Z_FAR) * 0.7; mq.air = 0.05; }
        }
        const pane = add(C, [[vx0, vista.y0, Z_FAR - 0.5], [vx1, vista.y0, Z_FAR - 0.5],
                             [vx1, vista.y1, Z_FAR - 0.5], [vx0, vista.y1, Z_FAR - 0.5]], ZERO8, "flat", "rgba(150,175,205,0.07)");
        if (pane) { pane.air = 0; pane.day = false; pane.nolite = true; }
      }
    } else {
      wallPiece(-W, 0, W, CEIL, lightAt(0, 210, Z_FAR));
    }
    const drawSee = (C, sc, px) => {
      const from = Math.max(sc.z0, Z_BACK), to = Math.min(sc.z1, Z_FAR);
      const mk = (pts, colour, lit, air) => {
        const q = add(C, pts, ZERO8, "flat", colour);
        if (q) { q.lit = lit; q.air = air; q.wall = sc.side; q.za = pts[0][2]; q.zb = pts[1][2]; }
        return q;
      };
      if (sc.kind === "glazing") {
        const pitch = sc.pitch || 161, mw = sc.mw || 7;
        for (let z = from; z < to; z += pitch) {
          const z1 = Math.min(z + pitch, to);
          // The pane: almost nothing. A window as bright as the room it looks out of is a mirror.
          const pane = mk([[px, sc.y0, z], [px, sc.y0, z1], [px, sc.y1, z1], [px, sc.y1, z]],
                          sc.tint || "rgba(150,175,205,0.07)", 0, 0);
          if (pane) { pane.day = false; pane.nolite = true; }
        }
        for (let m = Math.ceil(from / pitch) * pitch; m <= to; m += pitch) {
          const q = mk([[px, sc.y0, m - mw / 2], [px, sc.y0, m + mw / 2], [px, sc.y1, m + mw / 2], [px, sc.y1, m - mw / 2]],
                       sc.frame || "#1b2029", lightAt(px, (sc.y0 + sc.y1) / 2, m) * 0.7, 0.05);
          if (q) q.sz = q.z - 2;          // the frame in front of the pane it holds
        }
        return;
      }
      // railing: rails in 3 m pieces (a flat colour needs no 60 cm panel); iron bars near the eye,
      // and a thin screen of their density further off, where a bar is less than a pixel anyway.
      const top = sc.y1, low = sc.y0, bar = sc.bar || 2.4, gap = sc.gap || 14;
      const iron = sc.frame || "#202228", PIECE = 300;
      const mid = low + (top - low) * 0.32;
      /* Round 35: ornamental iron (`scroll`, the Table Rock parapet) is one band of the `ironscroll`
         tile, a cell as wide as the band is high, rather than bars: near the eye the tile, further
         off the same thin screen. Black iron keeps its own colour by day and by night (no sun, no
         wash over the clear between the scrolls, which would grey the gorge behind it). */
      if (sc.scroll && PATS.ironscroll) {
        const k = 128 / (top - low);
        for (let z = from; z < to; z += PIECE) {
          const z1 = Math.min(z + PIECE, to), zc = (z + z1) / 2;
          if (Math.abs(zc - C.z) >= 900) {
            const s = mk([[px, low, z], [px, low, z1], [px, top, z1], [px, top, z]], "rgba(18,19,22,0.42)", 0, 0.06);
            if (s) s.day = false;
            continue;
          }
          const q = add(C, [[px, low, z], [px, low, z1], [px, top, z1], [px, top, z]],
                        [z * k, 128, z1 * k, 128, z1 * k, 0, z * k, 0], "pat", PATS.ironscroll);
          if (q) { q.air = 0; q.lit = 0.5; q.day = false; q.nolite = true; q.wall = sc.side; q.za = z; q.zb = z1; }
        }
        return;
      }
      for (let z = from; z < to; z += PIECE) {
        const z1 = Math.min(z + PIECE, to), zc = (z + z1) / 2;
        const lit = lightAt(px, top, zc) * 0.8;
        mk([[px, top - 7, z], [px, top - 7, z1], [px, top, z1], [px, top, z]], iron, lit, 0.06);
        mk([[px, low, z], [px, low, z1], [px, low + 5, z1], [px, low + 5, z]], iron, lit, 0.06);
        mk([[px, mid, z], [px, mid, z1], [px, mid + 4, z1], [px, mid + 4, z]], iron, lit, 0.06);
        const near = Math.abs(zc - C.z) < 700;
        if (!near) {
          const s = mk([[px, low, z], [px, low, z1], [px, top, z1], [px, top, z]], "rgba(32,34,40,0.30)", 0, 0.06);
          if (s) s.day = false;
          continue;
        }
        for (let b = z + gap / 2; b < z1; b += gap) {
          mk([[px, low, b - bar / 2], [px, low, b + bar / 2], [px, top, b + bar / 2], [px, top, b - bar / 2]],
             iron, lit, 0.06);
        }
      }
    };
    /* Cladding, panel by panel.

       A band of shutter is drawn as the same 60 cm slices as the wall behind it, because an affine
       texture map is only exact across a panel that narrow — a single stretched quad over four metres
       of corrugated sheet would bend the ribs where the wall bends them differently, and that
       mismatch is exactly what makes a scene read as a decal. Two centimetres off the wall keeps the
       depth sort deciding in the cladding's favour without a visible offset, so there is no z-fight
       and nothing to polygon-offset. */
    surfaces.forEach((sc) => {
      const px = sc.side * (WALL - 2);
      /* Round 33: a band can be air, glass or a railing. `open` paints nothing -- the wall is not
         there, and the world beyond is drawn by the backdrop. `glazing` is a window wall: a mullion
         every `pitch` cm and a faint pane, so the city or the gorge behind it is the view and not a
         tile standing in for one. `railing` is iron bars and rails with air between them. */
      if (sc.kind === "open") return;
      if (sc.kind === "glazing" || sc.kind === "railing") { drawSee(C, sc, px); return; }
      /* Round 35: a service pipe along the wall (Journey's tunnels, from the photographs): galvanised,
         its face in two tones for the round of it and its underside -- it runs over the eye, so the
         underside is the side you see -- standing `out` off the wall, a coupling every 3 m. Cut in the
         wall's own 60 cm panels near the eye and sorted just in front of its nearest end: a 3 m piece
         sorted at its middle was painted over by the wall panels in front of that middle, and the pipe
         came out as a dashed shelf. Past 15 m the face alone, in 3 m pieces. */
      if (sc.kind === "pipe") {
        const out = sc.out || 9, fx = px - sc.side * out, ym = (sc.y0 + sc.y1) / 2;
        const from = Math.max(sc.z0, Z_BACK), to = Math.min(sc.z1, Z_FAR);
        const nl = (q, lit) => { if (q) { q.lit = lit; if (UNDER) q.nolite = true; } return q; };
        for (let z = from; z < to;) {
          const near = Math.abs(z - C.z) < 1500, step = near ? SEG : 300;
          const z1 = Math.min(z + step, to), zc = (z + z1) / 2, lit = lightAt(fx, sc.y1, zc);
          const bias = (q) => { if (q) q.sz = q.z - (z1 - z) / 2 - 4; };
          bias(nl(add(C, [[fx, ym, z], [fx, ym, z1], [fx, sc.y1, z1], [fx, sc.y1, z]], ZERO8, "flat", "#7a7f84"), lit));
          bias(nl(add(C, [[fx, sc.y0, z], [fx, sc.y0, z1], [fx, ym, z1], [fx, ym, z]], ZERO8, "flat", "#5a5f64"), lit));
          if (near) bias(nl(add(C, [[px, sc.y0, z], [px, sc.y0, z1], [fx, sc.y0, z1], [fx, sc.y0, z]], ZERO8, "flat", "#3d4145"), lit * 0.8));
          if (near && Math.floor(z1 / 300) !== Math.floor(z / 300)) {     // a coupling at each 3 m mark
            const cz = Math.floor(z1 / 300) * 300, cx = fx - sc.side * 1.5;
            const k = nl(add(C, [[cx, sc.y0 - 1.5, cz - 4], [cx, sc.y0 - 1.5, cz + 4], [cx, sc.y1 + 1.5, cz + 4],
                                 [cx, sc.y1 + 1.5, cz - 4]], ZERO8, "flat", "#686d72"), lit);
            if (k) k.sz = k.z - 40;
          }
          z = z1;
        }
        return;
      }
      const from = Math.max(sc.z0, Z_BACK), to = Math.min(sc.z1, Z_FAR);
      const pat = PATS[sc.kind] || tilePat;
      for (let z = Math.floor(from / SEG) * SEG; z < to; z += SEG) {
        const z0 = Math.max(z, from), z1 = Math.min(z + SEG, to);
        if (z1 - z0 < 1) continue;
        // One lit value per full-height panel is the cardboard look, but the fill budget is real:
        // only bands that ask for it (`grad` in the record — the hall's tall plaster) are sliced
        // into steps, and every step asks the lamps for its own level.
        const step = sc.grad ? (sc.y1 - sc.y0) / 2 : sc.y1 - sc.y0;
        for (let y = sc.y0; y < sc.y1; y += step) {
          const ya = y, yb = Math.min(y + step, sc.y1);
          const q = add(C, [[px, ya, z0], [px, ya, z1], [px, yb, z1], [px, yb, z0]],
              [z0 * DPM, -ya * DPM, z1 * DPM, -ya * DPM, z1 * DPM, -yb * DPM, z0 * DPM, -yb * DPM],
              "pat", pat);
          if (q) {
            q.wall = sc.side; q.za = z0; q.zb = z1;     // see the door's paint stack
            // `tone` is authored dirt: a band can be brighter or duller than the material it is cut
            // from, which is what a wall that has been patched and repainted once actually looks like.
            q.lit = lightAt(px, (ya + yb) / 2, (z0 + z1) / 2)
                    * (sc.kind === "shutter" ? 1.12 : 1) * (sc.tone === undefined ? 1 : sc.tone);
            // A shutter is metal and catches the light; plywood and brick mostly do not.
            if (sc.kind === "hoarding") q.lit *= 0.86;
            if (UNDER) q.nolite = true;
            /* Authored shade, the stand-in for a cast-shadow pass: the sun stands to the left, so
               the left wall face is turned away from it and takes a third of the lift, while the
               right face takes all of it. A street whose two walls share one noon has no sun
               direction, which is the flatness a shadow was meant to fix — and this fix is data
               the record could one day own. */
            if (DAYPAGE) {
              const az = sunAz(), k = Math.min(1, Math.abs(az));
              // The face turned away from the sun takes a third of the lift; at noon the sun is up
              // the lane and neither face is starved.
              const shaded = (sc.side === -1) === (az < 0);
              q.daygain = shaded ? 1 - 0.65 * k : 1;
            }
          }
        }
      }
    });
    drawMarks(C);
    lamps.forEach((L) => {
      if (L.body !== "lantern" || L.z < Z_BACK - 40 || L.z > Z_FAR + 40) return;
      const dx = swayOf(L);
      // Two planes crossed like a plus: from any yaw one is nearly edge on and the other carries the
      // silhouette. It is the cheapest thing that still reads as a volume, and it costs no trig.
      const R = L.size || 24, hh = R * 1.25, UV = [0, 0, 128, 0, 128, -128, 0, -128];
      [[L.x - R, L.z, L.x + R, L.z], [L.x, L.z - R, L.x, L.z + R]].forEach(([ax, az, bx, bz]) => {
        const q = add(C, [[ax + dx, L.y - hh, az], [bx + dx, L.y - hh, bz], [bx + dx, L.y + hh, bz],
                          [ax + dx, L.y + hh, az]], UV, "pat", PATS.lantern);
        /* A paper lantern is the whole point of a night, and it used to be lit 1.5 in the middle of
           the afternoon -- a red tube burning in daylight. It is paper with a candle in it: by day
           it is a red thing hanging on a wire, and after dark it is the light the street is lit by.
           `nolite` keeps it out of the night's darkening, so it is the last thing still bright. */
        if (q) {
          q.lit = 0.62 + 1.15 * NIGHT();
          q.nolite = true;            // paper and its candle: never darkened, never sunlit
          q.air = haze(q.z) * 0.5;
        }
      });
    });
    /* The compound out there is a picture with its own exposure, and the daylight lift must not fall
       on it. It is authored bright already (the sky bands carry `glow: 1.0`, the plaza 1.1), so lifting
       it at noon did what adding white to a gradient always does: the band the opening frames became a
       white blob 135 cm across and the gradient behind it disappeared. Sunlight does not fall on a
       mountain 1 200 m away in this renderer; it falls on the lane, and the lane is where the lift is
       for. Marked in one place rather than at each of the compound's own call sites, because every
       quad `drawFar` authors is that picture, including the aperture it is seen through. */
    if (bd) drawFar(C);
    /* The wall at your back is a surface with no authored cladding, and the material model's own
       default for that is the wall's tiles — not a flat colour. It was a flat plank, which meant that
       turning round at the entrance filled the screen with one grey rectangle three metres away and
       read as "the renderer stopped" rather than "the lane ends here". Lit, as everything is, by the
       room's own sources: there is no lamp behind the mouth, so it stays dim, and that is true. */
    /* Split into two heights rather than one: the tile above and a plinth of the same concrete the rest
       of the lane's lower walls are made of, because a wall that meets a wet floor in the same material
       it has at eye height is the one thing no alley wall does. It is one extra quad and it is what
       turns the frame behind you at the entrance from a pale rectangle into a wall. */
    const PLINTH = 92;
    if (!OPEN_BACK) {
    const back = add(C, [[WALL, PLINTH, Z_BACK], [-WALL, PLINTH, Z_BACK], [-WALL, CEIL, Z_BACK], [WALL, CEIL, Z_BACK]],
        [WALL * DPM, -PLINTH * DPM, -WALL * DPM, -PLINTH * DPM,
         -WALL * DPM, -CEIL * DPM, WALL * DPM, -CEIL * DPM], "pat", (WALLMAT && PATS[WALLMAT]) || tilePat);
    if (back) back.lit = lightAt(0, 210, Z_BACK);
    const plinth = add(C, [[WALL, 0, Z_BACK], [-WALL, 0, Z_BACK], [-WALL, PLINTH, Z_BACK], [WALL, PLINTH, Z_BACK]],
        [WALL * DPM, 0, -WALL * DPM, 0, -WALL * DPM, -PLINTH * DPM, WALL * DPM, -PLINTH * DPM],
        "pat", (WALLMAT && PATS[WALLMAT]) || concretePat);
    if (plinth) plinth.lit = lightAt(0, 30, Z_BACK) * 1.25;
    }

    beams.forEach((bz) => {          // so the ceiling has a rhythm, and the lane reads as a podium
      const y = CEIL - 26, half = 11;
      const under = add(C, [[-WALL, y, bz - half], [WALL, y, bz - half], [WALL, y, bz + half],
                            [-WALL, y, bz + half]], ZERO8, "flat", mix("#2c3a56", -0.1));
      if (under) under.lit = lightAt(0, CEIL - 30, bz) * 0.85;
      const face = add(C, [[-WALL, y, bz - half], [WALL, y, bz - half], [WALL, CEIL, bz - half],
                           [-WALL, CEIL, bz - half]], ZERO8, "flat", mix("#232f4a", -0.06));
      if (face) face.lit = AMBIENT * 0.7;
    });

    const patUV = (f) => {
      const u = (p) => (Math.abs(f.n[0]) === 1 ? p[2] : p[0]);
      const v = (p) => (f.n[1] === 1 ? p[2] : p[1]);
      return f.p.flatMap((p) => [u(p) * DPM, -v(p) * DPM]);
    };
    // Which material tile a boxy prop is made of; absent here, a face keeps its flat tint.
    const MATS = { crate: "wood", planter: "terrain", bench: "wood", parapet: "stonewall", deckwall: "concrete" };
    meta.forEach((m) => {
      const hw = m.w / 2;
      const onSide = Math.abs(m.ry) > 45;
      const corners = onSide
        ? [[m.x, m.y, m.z - hw], [m.x, m.y, m.z + hw], [m.x, m.y + m.h, m.z + hw], [m.x, m.y + m.h, m.z - hw]]
        : [[m.x - hw, m.y, m.z], [m.x + hw, m.y, m.z], [m.x + hw, m.y + m.h, m.z], [m.x - hw, m.y + m.h, m.z]];
      const lit = lightAt(m.x, m.y + m.h / 2, m.z);
      const face = m.pic ? "pic" : "flat";
      const uv = m.pic
        ? [[0, 0], [m.pic.naturalWidth || 640, 0], [m.pic.naturalWidth || 640, -(m.pic.naturalHeight || 427)], [0, -(m.pic.naturalHeight || 427)]]
        : [[0, 0], [0, 0], [0, 0], [0, 0]];
      const kind = kindOf(m.kind);
      const base = m.leaf || PROP_TINT[kind] || PROP_TINT[m.kind] || "#33435f";
      const shape = SHAPE[kind] || "plane";
      const S = m.states ? (m.states[m.st] || m.states[0]) : null;
      const drawn = [];
      // A face's material tile maps along its own axes: side faces read (depth, height), end
      // faces read (width, height), lids read (width, depth) — the same trick the walls use.
      // (declared once, above the branches)

      /* Contact shadow: anything standing on a floor or a tabletop throws a soft dark quad at its
         base, or it floats. Wall-hung things are exempt — their shadow is the wall's own darkness. */
      if (Math.abs(m.x) < WALL - 40 && kind !== "track" && kind !== "glassfloor" && !MODEL_KINDS.has(kind)) {
        const fw = (onSide ? m.d : m.w) * 0.68, fd = (onSide ? m.w : m.d) * 0.68;
        const cs = add(C, [[m.x - fw / 2, m.y + 1, m.z - fd / 2], [m.x + fw / 2, m.y + 1, m.z - fd / 2],
                           [m.x + fw / 2, m.y + 1, m.z + fd / 2], [m.x - fw / 2, m.y + 1, m.z + fd / 2]],
                       ZERO8, "flat", "rgba(4,8,18,0.34)");
        if (cs) { cs.lit = 0.5; drawn.push(cs); }
      }
      /* The prop's own cast shadow: the contact shadow says a prop stands, this one says where the
         sun stands. The floor piece runs away from the sun for h / tan(altitude) times the
         azimuth's strength, and where that run meets a wall it climbs it for the share it could
         not cross — a vending machine against the lit wall wears its own shadow at the right
         hour, and at noon the run is a sliver, because it is. */
      if (DAYPAGE && DAY() > 0.05 && m.y < 20 &&
          ["box", "bikes", "planter", "cones", "aboard", "glass"].includes(shape)) {
        const az = sunAz(), k = Math.min(1, Math.abs(az));
        const L = Math.min(420, (m.h / Math.tan(sunAlt())) * k);
        if (L > 8) {
          const sgn = az < 0 ? 1 : -1;                        // away from the sun
          const fw = onSide ? m.d : m.w, fd = onSide ? m.w : m.d;
          const z0 = m.z - fd / 2, z1 = m.z + fd / 2;
          const x0 = m.x + sgn * fw * 0.4, wallX = sgn * (WALL - 3);
          const xEnd = sgn > 0 ? Math.min(x0 + L, wallX) : Math.max(x0 - L, wallX);
          const fs = add(C, [[x0, 3, z0], [xEnd, 3, z0], [xEnd, 3, z1], [x0, 3, z1]],
                         ZERO8, "flat", `rgba(8,12,24,${(0.26 * DAY()).toFixed(3)})`);
          if (fs) { fs.day = false; fs.air = 0; drawn.push(fs); }
          const crossed = L - Math.abs(xEnd - x0);
          if (crossed > 4) {
            const ph = Math.min(m.h * 0.85, crossed * 0.9);
            const ws = add(C, [[wallX, 2, z0], [wallX, 2, z1], [wallX, ph, z1], [wallX, ph, z0]],
                           ZERO8, "flat", `rgba(8,12,24,${(0.24 * DAY()).toFixed(3)})`);
            if (ws) { ws.day = false; ws.air = 0; drawn.push(ws); }
          }
        }
      }
      if (shape === "box") {
        // Only the faces turned toward the eye are painted, and each carries its own tint: that is
        // the whole trick of volume here, and it costs three quads instead of one.
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          /* Round 58: a box honours the `tile` its record authored. It never did — the material
             lookup only knew `MATS`, so every block the strip gained came out as a bare tinted
             cuboid, and six of them in a row read as grey packing cases. A face is textured when the
             record names a tile for it; failing that, the old flat tint with its own face shade. */
          const mk2 = MATS[kind] || MATS[m.kind];
          const tile = m.tile && PATS[m.tile];
          const q = mk2 && PATS[mk2]
            ? add(C, f.p, patUV(f), "pat", PATS[mk2])
            : tile
              ? add(C, f.p, patUV(f), "pat", tile)
              : add(C, f.p, ZERO8, "flat", mix(base, f.k + (lit - 0.7) * 0.24));
          if (q) { q.lit = tile ? lit * (1 + f.k * 0.35) : lit; drawn.push(q); }
        });
        /* Round 63: a block is a building, so it has storeys.
           Six of these stand behind the strip's fronts and every one of them came out as a plain
           crate: a 4 m face of brick with nothing on it, seen over the awnings from the whole
           length of the street. A record that says `win` gets its windows — laid out by the face's
           own corners, so a block turned to the lane is windowed on the side the lane sees — a
           stone sill under each, and a cornice along the top. Nothing here is lettered. */
        if (m.win) {
          const rows = Math.max(1, m.win | 0), cols = Math.max(1, m.wincol || 3);
          const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
          facesOf(m).forEach((f) => {
            if (f.n[1] !== 0) return;                       // walls, not the lid
            const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                         + f.n[2] * (C.z - f.p[0][2]);
            if (toward <= 0) return;
            const bx0 = f.p[0], bx1 = f.p[1], tx1 = f.p[2], tx0 = f.p[3];   // bottom left/right, top right/left
            const proud = 2;                                // stand the joinery off its own wall
            const at = (u, v) => { const b = lerp(bx0, bx1, u), t = lerp(tx0, tx1, u), p = lerp(b, t, v);
              return [p[0] + proud * f.n[0], p[1], p[2] + proud * f.n[2]]; };
            // a cornice: a course proud of the wall along the whole top, one course deep
            const cq = add(C, [at(0, 0.965).map((v, i) => i === 1 ? v - 2 : v),
                               at(1, 0.965).map((v, i) => i === 1 ? v - 2 : v),
                               at(1, 1), at(0, 1)], ZERO8, "flat", mix(base, -0.26));
            if (cq) { cq.lit = lit * 0.92; drawn.push(cq); }
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const u0 = 0.12 + (c + 0.14) * (0.76 / cols), u1 = u0 + (0.76 / cols) * 0.64;
                /* The top storey only: the front's own box and awning cover the bottom two and a
                   half metres of these walls from the street, so windows there would be joinery
                   nailed up behind a shopfront. */
                const v0 = 0.46 + r * (0.46 / rows), v1 = v0 + (0.32 / rows);
                const w = add(C, [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], ZERO8, "flat",
                              blendHex("#22303f", "#93a6b8", DAY() * 0.55));
                if (w) { w.lit = 0.9; drawn.push(w); }
                // the sill: one line of stone under the opening, which is what makes a dark
                // rectangle read as a window and not as a hole in the wall
                const sl = add(C, [at(u0 - 0.01, v0 - 0.035), at(u1 + 0.01, v0 - 0.035),
                                   at(u1 + 0.01, v0 - 0.005), at(u0 - 0.01, v0 - 0.005)],
                               ZERO8, "flat", blendHex(base, "#d8d2c4", 0.55));
                if (sl) { sl.lit = lit * 1.05; drawn.push(sl); }
              }
            }
          });
        }
        /* Round 35: a trail lamp is the park's black lantern on its post (the photographs at the
           brink), not a bare pole -- a glazed head on a collar, a cap and a finial over it, its glass
           grey by day and lit from within after dark. */
        if (kind === "lamp" && m.h > 200) {
          const night = NIGHT() > 0.45;
          const part = (dy, h, w, col, glow) => facesOf({ ...m, y: m.y + m.h + dy, h, w, d: w }).forEach((f) => {
            const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1]) + f.n[2] * (C.z - f.p[0][2]);
            if (toward <= 0) return;
            const q = add(C, f.p, ZERO8, "flat", glow ? col : mix(col, f.k + (lit - 0.7) * 0.24));
            if (!q) return;
            q.lit = glow ? 1.3 : lit;
            if (glow) { q.nolite = true; q.day = false; }
            drawn.push(q);
          });
          part(-72, 7, 26, base, false);                                   // the collar
          part(-65, 46, 30, night ? "#ffdca0" : "#7c848b", night);         // the glass
          part(-19, 9, 40, base, false);                                   // the cap
          part(-10, 12, 14, base, false);                                  // the finial
        }
      } else if (shape === "signboard") {
        /* Round 64: a marquee is a lit board on a building, and it needs something to hold it up.

           The strip's two boards were plain boxes floating a metre above the awnings with nothing
           under them: at three metres -- which is where the square puts a visitor opposite the
           arcade -- a blank slab reads as a card on a stick. The base is the part that says how a
           board is held: a rail under it, a frame round its face, and two standoffs back to the
           wall. That is what makes a board part of the building instead of a shape in the air.

           The face stays blank. What a marquee says is a lease, and the lettering would belong to
           a business this street does not claim to have; what a board does is throw light on the
           pavement, and that much a drawing can keep. */
        const along = Math.abs(m.ry) > 45;
        const dir = m.x < 0 ? 1 : -1;                 // into the lane, whichever wall this is
        const half = m.w / 2, dep = m.d / 2;
        const P = (u, v, y) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l, keep) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (!q) return;
          q.lit = l;
          if (keep) { q.nolite = true; q.day = false; }
          drawn.push(q);
        };
        const y0 = m.y, y1 = m.y + m.h;
        /* The board keeps the district's clock: it comes up at its own phase, as the record's
           `liton` says, and a board that lit with the street would be one more lamp. */
        const phz = dayPhase();
        const np = ((((phz - 0.7) % 1) + 1) % 1) / 0.6;
        const ez = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
        const NL = m.liton ? NIGHT() * ez((np - (m.liton - 0.7) / 0.6) / 0.05) : NIGHT();
        // the face: a plate lit from within after dark, and a painted board by day
        Q([P(-half, dep, y0), P(half, dep, y0), P(half, dep, y1), P(-half, dep, y1)],
          blendHex(base, "#ffe0a8", NL * 0.82), 0.66 + 0.78 * NL, true);
        // the frame: a lip round the face, so the board is joinery and not a rectangle of colour
        Q([P(-half - 4, dep + 2, y1 - 10), P(half + 4, dep + 2, y1 - 10),
           P(half + 4, dep + 2, y1 + 4), P(-half - 4, dep + 2, y1 + 4)], mix(base, 0.16), lit);
        for (const uu of [-half - 4, half - 1]) {
          Q([P(uu, dep + 2, y0 - 4), P(uu + 5, dep + 2, y0 - 4),
             P(uu + 5, dep + 2, y1 + 4), P(uu, dep + 2, y1 + 4)], mix(base, 0.16), lit);
        }
        // the base rail: the board's own bottom member, standing proud of the wall
        Q([P(-half - 7, dep + 5, y0 - 17), P(half + 7, dep + 5, y0 - 17),
           P(half + 7, dep + 5, y0), P(-half - 7, dep + 5, y0)], mix(base, -0.2), lit * 0.88);
        // the standoffs: two short blocks that carry the board back to the wall it hangs on
        for (const uu of [-half + 26, half - 42]) {
          Q([P(uu, 0, y0 + 6), P(uu + 16, 0, y0 + 6),
             P(uu + 16, dep, y0 + 6), P(uu, dep, y0 + 6)], mix(base, -0.4), lit * 0.6);
          Q([P(uu, 0, y0 + 6), P(uu + 16, 0, y0 + 6),
             P(uu + 16, 0, y0 + 30), P(uu, 0, y0 + 30)], mix(base, -0.4), lit * 0.6);
        }
      } else if (shape === "parasol") {
        /* Round 64: the plaza's east side was an apron with two rails on it and nothing over the
           queue. A queue in the sun is a queue nobody stands in — the shade is what makes the
           apron a place to wait rather than a place to cross. This is the strip's own cloth on a
           mast: a square canvas pitched over four ribs, striped along the slope the way the
           awnings over the fronts are pitched, with a scalloped hem at its edge. The mast is a
           separate prop, so it can be solid: this draws only the cloth that hangs from it.

           The cloth was one pale sheet, and it was pale for a reason: #c9b489 is a light canvas,
           and the tile's tone map lifts the light end hardest, so it arrived as a bleached cream
           with no seam in it. A real parasol is read by its ribs, its sag between them and the
           shade it puts on the ground — so the cloth is deeper, the ribs are drawn, the hem
           scallops, and the square of shade falls on the paving where the sun says it falls. */
        const hw = m.w / 2, hd = m.d / 2, y0 = m.y;
        /* The apex's rise above the cloth's edge: the mast beside the canopy is 244 cm tall and the
           cloth's edge hangs at 204, so the apex is the mast's top and the canopy sits on its post
           instead of floating over it. */
        const rise = 40;
        const cloth = m.leaf || "#9c8460";
        const P = (u, v, y) => [m.x + u, y, m.z + v];
        const Q = (pts, col, l) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; drawn.push(q); }
        };
        const c = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
        /* The canopy's own shade on the paving: a parasol is the one thing in this plaza that
           puts a square of shade on the ground, and the ground is a paving now — something that
           can receive one. The sun stands where the record says it stands. */
        if (DAYPAGE && DAY() > 0.05) {
          const az = sunAz(), sgn = az < 0 ? 1 : -1;
          const L = Math.min(620, (y0 / Math.tan(sunAlt())) * Math.abs(az));
          if (L > 12) {
            const fs = add(C, [[m.x + sgn * 12, 2, m.z - hd * 0.82], [m.x + sgn * (L + 12), 2, m.z - hd * 0.82],
                               [m.x + sgn * (L + 12), 2, m.z + hd * 0.82], [m.x + sgn * 12, 2, m.z + hd * 0.82]],
                           ZERO8, "flat", `rgba(26,34,52,${(0.3 * DAY()).toFixed(3)})`);
            if (fs) { fs.day = false; fs.air = 0; drawn.push(fs); }
          }
        }
        for (let i = 0; i < 4; i++) {
          const [ax, az] = c[i], [bx, bz] = c[(i + 1) % 4];
          for (let s2 = 0; s2 < 4; s2++) {
            const t0 = s2 / 4, t1 = (s2 + 1) / 4;
            const p0 = [ax + (bx - ax) * t0, az + (bz - az) * t0];
            const p1 = [ax + (bx - ax) * t1, az + (bz - az) * t1];
            const q0 = [p0[0] * 0.1, p0[1] * 0.1], q1 = [p1[0] * 0.1, p1[1] * 0.1];
            /* The cloth hangs between the ribs: the hem of a real parasol is a scallop, and the
               panel between two ribs sits lower than the rib it hangs from. */
            const sag0 = s2 === 0 ? 0 : 7, sag1 = s2 === 3 ? 0 : 7;
            Q([P(p0[0], p0[1], y0 - sag0), P(p1[0], p1[1], y0 - sag1),
               P(q1[0], q1[1], y0 + rise), P(q0[0], q0[1], y0 + rise)],
              s2 % 2 ? mix(cloth, 0.2) : cloth, lit * (s2 % 2 ? 0.9 : 0.78));
          }
          /* The hem: a band at the edge with a scallop's point under every panel's middle. */
          for (let s2 = 0; s2 < 4; s2++) {
            const t0 = s2 / 4, t1 = (s2 + 1) / 4;
            const p0 = [ax + (bx - ax) * t0, az + (bz - az) * t0];
            const p1 = [ax + (bx - ax) * t1, az + (bz - az) * t1];
            const pm = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
            Q([P(p0[0], p0[1], y0), P(p1[0], p1[1], y0),
               P(p1[0], p1[1], y0 - 15), P(p0[0], p0[1], y0 - 15)], mix(cloth, -0.12), lit * 0.72);
            Q([P(p0[0], p0[1], y0 - 15), P(pm[0], pm[1], y0 - 34),
               P(p1[0], p1[1], y0 - 15)], mix(cloth, -0.12), lit * 0.72);
          }
          /* The rib: the seam the cloth is stretched over, a narrow strip down each corner. */
          const prev = c[(i + 3) % 4], next = c[(i + 1) % 4];
          const B = [ax + (prev[0] - ax) * 0.035, az + (prev[1] - az) * 0.035];
          const Cc = [ax + (next[0] - ax) * 0.035, az + (next[1] - az) * 0.035];
          Q([P(ax, az, y0), P(B[0], B[1], y0), P(0, 0, y0 + rise)], mix(cloth, -0.2), lit * 0.6);
          Q([P(ax, az, y0), P(0, 0, y0 + rise), P(Cc[0], Cc[1], y0)], mix(cloth, -0.2), lit * 0.6);
        }
      } else if (shape === "vending") {
        /* A machine that is still working when the street is not (round 56). The object table's
           whole read is the lit shelf of cans behind glass over a *white* cabinet, and its delivery
           port is an **opening**: the reference released a can inside a solid 0.72 m body, where it
           fell for the whole 1.9 s, so the mouth here is a recess and never a printed panel. No
           brand, no price, no character -- the shelves are rows of pale studs and the header above
           them carries nothing, because what is written on a real machine is not ours to write.

           The face is the prop's local +z turned by `ry`, so a machine against the west wall and
           one against the east face each other without the record needing a second shape; the
           width is its local +x. The glass and the header are authored as always-lit: the one
           thing on a night street whose light does not come from a lamp in the record. */
        const th = ((m.ry || 0) * Math.PI) / 180;
        const nx = Math.sin(th), nz = Math.cos(th), ux = Math.cos(th), uz = -Math.sin(th);
        const hw = m.w / 2, hd = m.d / 2;
        // `v` is how far inside the cabinet a point sits, measured in from the glass face
        const P = (u, y, v) => [m.x + ux * u + nx * (hd - v), y, m.z + uz * u + nz * (hd - v)];
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix(base, f.k + (lit - 0.7) * 0.2));
          if (q) { q.lit = lit; drawn.push(q); }
        });
        const Q = (pts, col, l, keep) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (!q) return;
          q.lit = l;
          if (keep) { q.nolite = true; q.day = false; }
          drawn.push(q);
        };
        // the plinth it stands on and the mouth it drops the can through
        Q([P(-hw + 2, m.y, -1), P(hw - 2, m.y, -1), P(hw - 2, m.y + m.h * 0.09, -1),
           P(-hw + 2, m.y + m.h * 0.09, -1)], "#1b2430", lit * 0.6);
        const gu = hw - 5;
        Q([P(-hw * 0.44, m.y + m.h * 0.11, -1), P(hw * 0.44, m.y + m.h * 0.11, -1),
           P(hw * 0.44, m.y + m.h * 0.33, -1), P(-hw * 0.44, m.y + m.h * 0.33, -1)],
          "#0a1220", 0.14);
        // the cabinet's own frame, so the front is joinery and not a white slab. The colours here
        // are authored rather than derived from the white body: a machine's whole read is contrast
        // -- pale cabinet, dark glass, bright cans -- and `mix(white, -0.2)` is still white.
        const gy0 = m.y + m.h * 0.40, gy1 = m.y + m.h * 0.92;
        [[-gu - 7, -gu, gy0 - 8, gy1 + 8], [gu, gu + 7, gy0 - 8, gy1 + 8]].forEach(([ua, ub, ya, yb]) => {
          Q([P(ua, ya, -1.2), P(ub, ya, -1.2), P(ub, yb, -1.2), P(ua, yb, -1.2)],
            "#aeb9c6", lit * 0.9);
        });
        Q([P(-hw + 3, gy1 + 8, -1.2), P(hw - 3, gy1 + 8, -1.2),
           P(hw - 3, gy1 + 15, -1.2), P(-hw + 3, gy1 + 15, -1.2)], "#9aa6b4", lit * 0.9);
        // the glass: a dark interior that is lit from inside, which is a different thing from a pale
        // panel. `nolite` because no lamp in the record stands here -- a working machine is the one
        // surface on this street whose light is its own, and the record says so by naming the machine
        Q([P(-gu, gy0, -1.5), P(gu, gy0, -1.5), P(gu, gy1, -1.5), P(-gu, gy1, -1.5)],
          "#1d2b3a", 1.1, true);
        Q([P(-gu, gy0, -2.4), P(gu, gy0, -2.4), P(gu, gy1, -2.4), P(-gu, gy1, -2.4)],
          "#33506c", 1.28, true);
        // three shelves, three cans a row with a band round each, and not one of them labelled
        for (let r = 0; r < 3; r++) {
          const y = gy0 + (gy1 - gy0) * (0.18 + r * 0.27);
          Q([P(-gu, y - 3, -2.2), P(gu, y - 3, -2.2), P(gu, y - 1, -2.2), P(-gu, y - 1, -2.2)],
            "#8fa8c4", 1.4);
          for (let i = 0; i < 3; i++) {
            const u = -gu + 14 + i * ((2 * gu - 28) / 2);
            Q([P(u - 8, y + 2, -2.8), P(u + 8, y + 2, -2.8), P(u + 8, y + 24, -2.8),
               P(u - 8, y + 24, -2.8)], i % 2 ? "#f2f8ff" : "#cfe2f5", 1.55, true);
            Q([P(u - 8, y + 5, -3.0), P(u + 8, y + 5, -3.0), P(u + 8, y + 13, -3.0),
               P(u - 8, y + 13, -3.0)], i % 2 ? "#7fa8cf" : "#c4472f", 1.5, true);   // the can's band
          }
        }
        // the coin panel and the change slot, lit the way the glass is, and both wordless
        Q([P(hw * 0.34, gy0 + 8, -1.6), P(hw * 0.78, gy0 + 8, -1.6),
           P(hw * 0.78, gy0 + 42, -1.6), P(hw * 0.34, gy0 + 42, -1.6)], "#22303f", 0.55);
        Q([P(hw * 0.38, gy0 + 12, -1.8), P(hw * 0.74, gy0 + 12, -1.8),
           P(hw * 0.74, gy0 + 20, -1.8), P(hw * 0.38, gy0 + 20, -1.8)], "#8fd0b0", 1.2, true);
        Q([P(hw * 0.38, gy0 + 26, -1.8), P(hw * 0.74, gy0 + 26, -1.8),
           P(hw * 0.74, gy0 + 34, -1.8), P(hw * 0.38, gy0 + 34, -1.8)], "#e7eef7", 1.1, true);
        // the flap over the port, and the header panel, blank the way a machine's own is
        Q([P(-hw * 0.5, m.y + m.h * 0.345, -1.5), P(hw * 0.5, m.y + m.h * 0.345, -1.5),
           P(hw * 0.5, m.y + m.h * 0.385, -1.5), P(-hw * 0.5, m.y + m.h * 0.385, -1.5)],
          mix(base, -0.26), lit * 0.9);
        Q([P(-gu, m.y + m.h * 0.945, -1.5), P(gu, m.y + m.h * 0.945, -1.5),
           P(gu, m.y + m.h * 0.985, -1.5), P(-gu, m.y + m.h * 0.985, -1.5)],
          "#dfe9f5", 1.35, true);
      } else if (shape === "bin") {
        /* A litter bin (round 56), the way a street's is made: a tapered body, a lid with a slot,
           a kick plate at the foot so it does not look painted on the paving. Until now a bin was
           the `box` branch -- a 68 cm cube -- and a cube on a street reads as a crate. */
        const along = Math.abs(m.ry) > 45;
        const dir = along ? (m.x < 0 ? 1 : -1) : (m.z > 0 ? -1 : 1);
        const P = (u, y, v) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l) => { const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; drawn.push(q); } };
        /* The body is a box of its own width and depth and *all* its faces are painted -- the box
           branch's rule, which keeps a bin a solid from every heading. The lid is drawn as a slightly
           proud cap over it and the slot is cut into the lid's front, so the silhouette is a bin's
           and not a crate's. */
        facesOf({ ...m, h: m.h * 0.84 }).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          Q(f.p, mix(base, f.k + (lit - 0.7) * 0.2), lit);
        });
        const lidY = m.y + m.h * 0.84, hw = m.w / 2;
        facesOf({ ...m, y: lidY, h: m.h * 0.16, w: m.w + 3, d: m.d + 3 }).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          Q(f.p, mix(base, f.k + 0.1), lit * 1.1);
        });
        // the mouth on the lane side, and the kick plate that says the body is not painted on
        Q([P(-hw * 0.52, lidY + m.h * 0.05, -1.5), P(hw * 0.52, lidY + m.h * 0.05, -1.5),
           P(hw * 0.52, lidY + m.h * 0.115, -1.5), P(-hw * 0.52, lidY + m.h * 0.115, -1.5)],
          "#10161f", 0.18);
        Q([P(-hw + 3, m.y, -1.2), P(hw - 3, m.y, -1.2), P(hw - 3, m.y + m.h * 0.1, -1.2),
           P(-hw + 3, m.y + m.h * 0.1, -1.2)], mix(base, -0.34), lit * 0.76);
      } else if (shape === "bench") {
        /* A bench, not a slab (round 56). Until now a bench was drawn by the `box` branch -- the
           plainest piece of street furniture there is, and the one a visitor is asked to read by
           silhouette alone, was a 150 x 84 x 48 crate. A bench is a seat on two end frames with a
           back against the wall and slats running its length; those three facts are its whole
           picture, so they are what is drawn. `v` runs away from the wall the bench leans on. */
        const along = Math.abs(m.ry) > 45;
        const dir = along ? (m.x < 0 ? 1 : -1) : (m.z > 0 ? -1 : 1);
        const P = (u, y, v) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l) => { const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; drawn.push(q); } };
        const seatY = m.y + m.h * 0.44, backY = m.y + m.h, dIn = m.d;
        /* Two legs an end and a rail between them, not a solid panel: a 40 cm-wide end frame in a
           dark tint reads as a black box standing beside the bench, which is what the first draft
           of this painter did. The air under the seat is the same argument the rack makes. */
        [-1, 1].forEach((sg) => {
          const u0 = sg * (m.w / 2 - 9), u1 = sg * (m.w / 2);
          const a = Math.min(u0, u1), b = Math.max(u0, u1);
          [6, dIn - 8].forEach((v) => {                // a front leg and a back one
            Q([P(a, m.y, v), P(b, m.y, v), P(b, seatY - 2, v), P(a, seatY - 2, v)],
              mix(base, -0.26), lit * 0.8);
            Q([P(b, m.y, v), P(b, m.y, v + 6), P(b, seatY - 2, v + 6), P(a - 0, seatY - 2, v + 6)],
              mix(base, -0.34), lit * 0.68);
          });
          Q([P(a, seatY - 8, 6), P(b, seatY - 8, 6), P(b, seatY - 2, dIn - 8), P(a, seatY - 2, dIn - 8)],
            mix(base, -0.14), lit * 0.94);             // the rail the seat sits on
        });
        Q([P(-m.w / 2, seatY, 8), P(m.w / 2, seatY, 8), P(m.w / 2, seatY, dIn), P(-m.w / 2, seatY, dIn)],
          mix(base, 0.16), lit * 1.14);                 // the seat
        Q([P(-m.w / 2, seatY - 7, dIn), P(m.w / 2, seatY - 7, dIn),
           P(m.w / 2, seatY, dIn), P(-m.w / 2, seatY, dIn)], mix(base, 0.02), lit * 0.96);   // its lip
        [-0.26, 0, 0.26].forEach((t) => {               // three gaps, so it reads as slats
          const u0 = t * m.w - 3, u1 = t * m.w + 3;
          Q([P(u0, seatY + 1, 10), P(u1, seatY + 1, 10), P(u1, seatY + 1, dIn - 3), P(u0, seatY + 1, dIn - 3)],
            mix(base, -0.32), lit * 0.8);
        });
        /* The back is three slats, not one board: a single panel at this size reads as a hoarding,
           and the gaps are what let a dark bench sit against a dark shutter and still be a bench. */
        [0, 1, 2].forEach((i) => {
          const y0 = seatY + 6 + i * (backY - seatY - 6) * 0.335, y1 = y0 + (backY - seatY - 6) * 0.24;
          const v0 = 11 - (i * 1.4), v1 = 7 - (i * 1.4);
          Q([P(-m.w / 2, y0, v0), P(m.w / 2, y0, v0), P(m.w / 2, y1, v1), P(-m.w / 2, y1, v1)],
            mix(base, 0.08 + i * 0.03), lit * (1.02 + i * 0.03));
        });
        [-1, 1].forEach((sg) => {                       // the two stiles that hold them
          const u0 = sg * (m.w / 2 - 14), u1 = sg * (m.w / 2 - 5);
          const a = Math.min(u0, u1), b = Math.max(u0, u1);
          Q([P(a, seatY, 12), P(b, seatY, 12), P(b, backY, 6), P(a, backY, 6)], mix(base, -0.2), lit * 0.9);
        });
      } else if (shape === "rack") {
        /* A rack (round 56): two end frames, a top rail and three bars. The object table's figure
           is 140 x 76 x 90 -- a laundry rack's proportions -- and what says "rack" rather than
           "cabinet" is the air you can see through it, so it stays a frame and never a body. */
        const along = Math.abs(m.ry) > 45;
        const dir = along ? (m.x < 0 ? 1 : -1) : (m.z > 0 ? -1 : 1);
        const P = (u, y, v) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l) => { const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; drawn.push(q); } };
        const t = Math.max(4, m.w * 0.045);
        [-1, 1].forEach((sg) => {                       // an end frame, drawn as its two posts
          [-1, 1].forEach((sv) => {
            const u0 = sg * (m.w / 2) - (sg > 0 ? t : 0), u1 = u0 + t;
            const v0 = m.d * 0.5 + sv * m.d * 0.42 - 3, v1 = v0 + 6;
            Q([P(u0, m.y, v0), P(u1, m.y, v0), P(u1, m.y + m.h, v0), P(u0, m.y + m.h, v0)],
              mix(base, -0.24), lit * 0.78);
            Q([P(u1, m.y, v0), P(u1, m.y, v1), P(u1, m.y + m.h, v1), P(u1, m.y + m.h, v0)],
              mix(base, -0.32), lit * 0.68);
          });
        });
        [0.98, 0.62, 0.24].forEach((f, i) => {          // the top rail, then the bars under it
          const y = m.y + m.h * f, v = m.d * 0.5;
          const hgt = i === 0 ? 7 : 5;
          Q([P(-m.w / 2, y, v - 4), P(m.w / 2, y, v - 4), P(m.w / 2, y, v + 4), P(-m.w / 2, y, v + 4)],
            mix(base, 0.18 - i * 0.03), lit * 1.16);
          Q([P(-m.w / 2, y - hgt, v + 4), P(m.w / 2, y - hgt, v + 4),
             P(m.w / 2, y, v + 4), P(-m.w / 2, y, v + 4)], mix(base, -0.1), lit * 0.94);
        });
      } else if (shape === "door") {
        /* A door is joinery, not a rectangle: a dark reveal behind it, a leaf with two inset panels
           and a handle, a threshold under it, and a lit fanlight over its head — that fanlight is
           why a street door reads from down the street. The record may tint the leaf per door
           (`data-leaf`); `door` in the states slides it ajar across the reveal, which is the same
           trick the booth's sliding door earned: a hinge needs a second axis this painter lacks. */
        const along = Math.abs(m.ry) > 45;
        const dir = along ? (m.x < 0 ? 1 : -1) : (m.z < 0 ? -1 : 1);
        const half = m.w / 2, ins = Math.max(m.d, 10), ajar = S && S.door ? S.door : 0;
        const lift = kind === "lift" || m.lift;
        const P = (u, v, y) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l, air) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); }
        };
        const from = drawn.length;
        /* The reveal goes behind the leaf. An end door is built back from the room (+v runs away
           from whoever faces it), a side door out from its wall (+v runs into the lane), so one
           offset stood every side door's dark reveal ten centimetres in front of its own leaf.
           Seen down the street a sort tie hid it; turned to face the door, the door was a blank
           slab. Round 31 found all four side doors that way in Chromium. */
        const back = along ? 1 : ins;
        const lw = m.w * 0.92, y1 = m.h * 0.94;
        if (lift) {
          /* A lift landing: two brushed leaves on a centre seam in a steel frame — no panels, no
             handle, no fanlight, which are a street door's. `door` parts the leaves into their
             pockets (each shrinks toward its jamb, so nothing slides out over the wall) and the
             gap shows the lit cab instead of the dark reveal. */
          Q([P(-half, back, 0), P(half, back, 0), P(half, back, m.h), P(-half, back, m.h)],
            ajar ? "#b9a682" : mix(base, -0.42), ajar ? 0.7 + ajar * 0.7 : lit * 0.5);
          const open = (1 - ajar) * (lw / 2 - 0.6);
          if (open > 1) {
            Q([P(-lw / 2, 4, 0), P(-lw / 2 + open, 4, 0), P(-lw / 2 + open, 4, y1), P(-lw / 2, 4, y1)],
              mix(base, 0.34), lit * 1.1);
            Q([P(lw / 2 - open, 4, 0), P(lw / 2, 4, 0), P(lw / 2, 4, y1), P(lw / 2 - open, 4, y1)],
              mix(base, 0.28), lit * 1.1);
          }
          Q([P(-half, 5, 0), P(-lw / 2, 5, 0), P(-lw / 2, 5, m.h), P(-half, 5, m.h)], mix(base, 0.48), lit * 1.2);
          Q([P(lw / 2, 5, 0), P(half, 5, 0), P(half, 5, m.h), P(lw / 2, 5, m.h)], mix(base, 0.48), lit * 1.2);
          Q([P(-half, 5, y1), P(half, 5, y1), P(half, 5, m.h), P(-half, 5, m.h)], mix(base, 0.48), lit * 1.2);
          Q([P(-half, 2, 0), P(half, 2, 0), P(half, 2, 3), P(-half, 2, 3)], mix(base, 0.5), lit * 1.2);
        } else {
          Q([P(-half, back, 0), P(half, back, 0), P(half, back, m.h), P(-half, back, m.h)],
            mix(base, -0.42), lit * 0.5);
          const slide = ajar * lw * 0.8;
          const leaf = (u0, u1, ya, yb, col, l) =>
            Q([P(u0 + slide, 4, ya), P(u1 + slide, 4, ya), P(u1 + slide, 4, yb), P(u0 + slide, 4, yb)],
              col, l);
          leaf(-lw / 2, lw / 2, 0, y1, mix(base, 0.16), lit * 1.05);
          if (ajar < 0.9) {
            leaf(-lw * 0.32, -lw * 0.08, m.h * 0.16, m.h * 0.44, mix(base, -0.3), lit * 0.78);
            leaf(-lw * 0.32, -lw * 0.08, m.h * 0.54, m.h * 0.84, mix(base, -0.3), lit * 0.78);
            leaf(lw * 0.08, lw * 0.32, m.h * 0.16, m.h * 0.44, mix(base, -0.3), lit * 0.78);
            leaf(lw * 0.08, lw * 0.32, m.h * 0.54, m.h * 0.84, mix(base, -0.3), lit * 0.78);
          }
          leaf(lw * 0.5 - 20, lw * 0.5 - 5, m.h * 0.4, m.h * 0.54, "#e2d2ae", lit * 1.9);
          Q([P(-half, 6, y1), P(half, 6, y1), P(half, 6, m.h), P(-half, 6, m.h)], "#f0c27a", 2.1, 0.05);
          Q([P(-half, 2, 0), P(half, 2, 0), P(half, 2, 6), P(-half, 2, 6)], mix(base, 0.3), lit * 1.1);
          /* A doorway you can read from down the street: a lit jamb either side of the leaf, and the
             fanlight's colour spilled onto the ground in front of it. A door with no light on it is
             a wall; these three quads are the difference. */
          Q([P(-half, 3, 0), P(-half + 5, 3, 0), P(-half + 5, 3, y1), P(-half, 3, y1)], "#f0c27a", 1.8);
          Q([P(half - 5, 3, 0), P(half, 3, 0), P(half, 3, y1), P(half - 5, 3, y1)], "#f0c27a", 1.8);
        }
        /* One stack, painted in the order it was built. The joinery is layers on one face, and a
           painter that sorts each quad by its own centre puts the far panels and the handle under
           the leaf they are set into. A side door must also clear the wall slices it stands on,
           each sorted by its own centre as well, so its stack goes just ahead of the nearest one
           behind it — no further, or a pole standing in front of the door would sink under it. */
        const face = drawn.slice(from);
        if (face.length) {
          let at = Math.min(...face.map((q) => q.z));
          if (along) {
            const side = Math.sign(m.x), z0 = m.z - half, z1 = m.z + half;
            quads.forEach((w) => { if (w.wall === side && w.za < z1 && w.zb > z0) at = Math.min(at, w.z - 1); });
          }
          face.forEach((q, i) => { q.sz = at - i * 0.01; });
        }
        // The spill is floor, not face: it keeps its own depth, and a lift lights no pavement.
        if (!lift) {
          Q([P(-half, 6, 0), P(half, 6, 0), P(half, 76, 0), P(-half, 76, 0)],
            "rgba(240,194,122,0.22)", 1.2, 0.06);
        }
      } else if (shape === "cloth") {
        const along = Math.abs(m.ry) > 45;
        const len = m.w, n = 4, gap = 8;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * len - len / 2, a1 = ((i + 1) / n) * len - len / 2 - gap / n;
          const q = along
            ? add(C, [[m.x, m.y, m.z + a0], [m.x, m.y, m.z + a1], [m.x, m.y + m.h, m.z + a1],
                      [m.x, m.y + m.h, m.z + a0]], ZERO8, "flat", mix(base, i % 2 ? -0.1 : 0.06))
            : add(C, [[m.x + a0, m.y, m.z], [m.x + a1, m.y, m.z], [m.x + a1, m.y + m.h, m.z],
                      [m.x + a0, m.y + m.h, m.z]], ZERO8, "flat", mix(base, i % 2 ? -0.1 : 0.06));
          if (q) { q.lit = lit + 0.2; drawn.push(q); }
        }
      } else if (shape === "front") {
        // Two kinds of front. Without an `awn` colour this is the old closed front: a box standing
        // proud of the wall, because a true recess would need a hole in a wall that is one surface.
        // With one, it is a shop hugging the wall — display glass, mullions, a blank fascia and a
        // canvas that stands out over the walk. A walker reads a proud box as a crate; the retail
        // face of a shopping street has to be drawn at the wall, with only the canvas in the lane.
        const along = Math.abs(m.ry) > 45;
        const dir = m.x < 0 ? 1 : -1;                 // into the lane, whichever wall this is
        const half = m.w / 2, ins = m.d, head = m.h * 0.84;
        // An interior that burns at noon reads as a lamp, not a shop: the sun takes most of it.
        const dl = 1 - 0.62 * DAY();
        const P = (u, v, y) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l, air) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); }
        };
        const up = S && S.shut !== undefined ? S.shut : 0;
        const yA = m.h * 0.8;                       // the head of the unit's own wall
        /* Round 64: a shopfront is a wall with a hole in it, and the hole has two parts.

           The strip's units had one: a window bay across the whole frontage. At three metres --
           which is where the square puts a visitor opposite an arcade -- a row of them read as
           cream boards with a stripe over them: a shopfront with no door is a display case, and a
           row of display cases with nothing between them is a fence. So a unit now carries a door
           bay at one end (the end alternates along the row, so the run has a rhythm), a window bay
           beside it, and a pier at each end standing proud of the wall -- the arcade's columns.
           The door is the part that says "you may come in": a recessed leaf, a frame, a fanlight
           and a threshold, warm from within after dark. */
        const pier = Math.min(26, half * 0.22);              // a column's width, at each end
        const doorW = Math.min(104, Math.max(58, (half * 2 - pier * 2) * 0.34));
        const idTxt = (m.el && m.el.dataset.obj) || "";
        let hsum = 0;
        for (let i = 0; i < idTxt.length; i++) hsum = (hsum * 31 + idTxt.charCodeAt(i)) % 100003;
        const side = hsum % 2 ? -1 : 1;                       // which end the door stands on
        const dOut = side > 0 ? half - pier : -half + pier;   // the door bay's outer edge
        const dIn = dOut - side * doorW;                      // and its inner edge
        const w0 = side > 0 ? -half + pier : dIn;             // the window bay's extent
        const w1 = side > 0 ? dIn : half - pier;
        const doorH = Math.min(210, yA - 40);
        if (m.awn) {
          const out = m.awnout || 130, yB = yA - 34, val = 20;
          Q([P(-half, 2, 0), P(half, 2, 0), P(half, 2, 46), P(-half, 2, 46)], mix(base, -0.22), lit);
          // The arcade's columns: a pier at each end of the unit, standing proud of the wall. They
          // are the building's, so they stand whether the shop is open or shut -- which is what
          // makes a row of units read as one colonnade instead of a row of separate boxes.
          for (const [pa, pb] of [[-half, -half + pier], [half - pier, half]]) {
            Q([P(pa, 15, 0), P(pb, 15, 0), P(pb, 15, yA), P(pa, 15, yA)], mix(base, 0.1), lit);
            Q([P(pa, 0, 0), P(pa, 15, 0), P(pa, 15, yA), P(pa, 0, yA)], mix(base, -0.22), lit * 0.72);
            Q([P(pa - 4, 3, yA - 18), P(pb + 4, 3, yA - 18), P(pb + 4, 3, yA), P(pa - 4, 3, yA)],
              mix(base, 0.18), lit);
          }
          if (up > 0.5) {
            // Open: display glass at the wall's own face, mullions over it, and one warm shelf of
            // light that the sun mostly takes. The glass is pale by day and dark by night, so an
            // open shop reads as glass in both, not as a hole.
            /* Round 61: an open front read as a *plate*.

               At three metres — which is where the plaza puts a visitor opposite an arcade — this
               was one flat quad of `#93a6b8` at `lit` 1.3, i.e. a colour already near white carried
               past the tone curve: every shop on the strip came out the same pale cream slab, with
               nothing in it. Above that, one glass pane with two mullions is not a shopfront: the
               frame of a fun-row arcade is narrow and often, the glass sits behind a deep reveal,
               and what the eye reads at close range is *depth* — a dark interior with hangs of light
               in it, and joinery in front of the dark.
               So the pane is a recess now: the interior wall stands 40 cm back in its own dark, the
               glass is dimmer than the render's own lift (it is glass, not a lamp), and the frame is
               six narrow members over a stall riser and two transoms. */
            Q([P(w0, 3, 0), P(w1, 3, 0), P(w1, 3, yA - 6), P(w0, 3, yA - 6)],
              mix(base, -0.52), lit * 0.5);                     // the interior behind the glass
            const gl = add(C, [P(w0 + 6, 4, 46), P(w1 - 6, 4, 46), P(w1 - 6, 4, yA - 10),
                               P(w0 + 6, 4, yA - 10)], ZERO8, "flat", blendHex("#243146", "#7c8ea3", DAY()));
            if (gl) { gl.lit = 0.52 + 0.22 * DAY(); gl.daygain = 0.5; drawn.push(gl); }
            // What is behind the glass: a lit shelf of hangs, low, so the interior is not a void.
            const wspan = w1 - w0;
            for (let i = 0; i < 3; i++) {
              const u0 = w0 + (i / 3) * wspan;
              Q([P(u0, 7, 88), P(u0 + wspan * 0.26, 7, 88), P(u0 + wspan * 0.26, 7, 132), P(u0, 7, 132)],
                i % 2 ? "#c9a06a" : "#d8b483", (0.42 + up * 0.5) * dl, 0.05);
            }
            for (let i = 0; i <= 5; i++) {
              const u0 = w0 + (i / 5) * wspan - 4;
              Q([P(u0, 2, 40), P(u0 + 8, 2, 40), P(u0 + 8, 2, yA - 4), P(u0, 2, yA - 4)],
                "#2a3448", lit * 0.62);
            }
            for (const yy of [46, 118, yA - 12]) {
              Q([P(w0 + 4, 2, yy), P(w1 - 4, 2, yy), P(w1 - 4, 2, yy + 8), P(w0 + 4, 2, yy + 8)],
                "#2a3448", lit * 0.62);
            }
            /* The door bay. The leaf stands in the same recess as the glass, so the unit reads as
               one wall with two holes in it rather than a window with a door stuck on the side. */
            /* Round 69i: two of these were `mix(from, to, t)` calls left over from a signature that
               no longer exists. `mix` takes (hex, lift) now, so the third argument hit its own
               guard -- a console warning, an unchanged colour, and a threshold that was never
               lifted -- every time a shopfront was built. A two-colour blend is `blendHex`. */
            Q([P(dIn, 0, 0), P(dOut, 0, 0), P(dOut, ins, 4), P(dIn, ins, 4)],
              blendHex("#8d8578", base, 0.25), lit);             // the threshold at the door's feet
            Q([P(dIn, 3, 0), P(dOut, 3, 0), P(dOut, 3, yA - 4), P(dIn, 3, yA - 4)],
              mix(base, -0.64), lit * 0.3);                      // the reveal behind the leaf
            Q([P(dIn + 9, 4, 0), P(dOut - 9, 4, 0), P(dOut - 9, 4, doorH), P(dIn + 9, 4, doorH)],
              blendHex("#3c2f26", base, 0.3), lit * (0.62 + up * 0.38) * dl);
            // the frame: two jambs and a head, proud of the leaf
            for (const uu of [dIn + 2, dOut - 9]) {
              Q([P(uu, 2, 0), P(uu + 7, 2, 0), P(uu + 7, 2, doorH + 44), P(uu, 2, doorH + 44)],
                "#39404e", lit * 0.8);
            }
            Q([P(dIn + 2, 2, doorH + 44), P(dOut - 7, 2, doorH + 44), P(dOut - 7, 2, doorH + 56),
               P(dIn + 2, 2, doorH + 56)], "#39404e", lit * 0.8);
            // the fanlight over the door: the one warm pane of the unit
            const fan = add(C, [P(dIn + 9, 4, doorH + 12), P(dOut - 9, 4, doorH + 12),
                                P(dOut - 9, 4, doorH + 40), P(dIn + 9, 4, doorH + 40)], ZERO8, "flat",
                             blendHex("#5d6a7c", "#ffce8e", NIGHT() * 0.92));
            if (fan) { fan.lit = 0.45 + 0.85 * NIGHT(); fan.daygain = 0.35; drawn.push(fan); }
          } else {
            // Shut: the blade across the face, the same shutter as the cladding.
            const blade = add(C, [P(-half, 6, 0), P(half, 6, 0), P(half, 6, yA - 4), P(-half, 6, yA - 4)],
                [m.z * DPM - half * DPM, 0, m.z * DPM + half * DPM, 0,
                 m.z * DPM + half * DPM, -(yA - 4) * DPM, m.z * DPM - half * DPM, -(yA - 4) * DPM],
                "pat", PATS.shutter);
            if (blade) { blade.lit = lit * 1.05; drawn.push(blade); }
            // Round 64: a closed unit was a blade and nothing else -- no returns, no hood, so the
            // shut shops on the strip read as a flat band of corrugation. The hood over the blade
            // and the two reveals at its ends are what make it a closed shopfront.
            Q([P(-half - 3, 7, yA - 6), P(half + 3, 7, yA - 6), P(half + 3, 7, yA + 16), P(-half - 3, 7, yA + 16)],
              blendHex("#39404e", base, 0.2), lit * 0.9);
            for (const uu of [-half, half - 9]) {
              Q([P(uu, 2, 0), P(uu + 9, 2, 0), P(uu + 9, 2, yA - 4), P(uu, 2, yA - 4)],
                mix(base, -0.34), lit * 0.6);
            }
          }
          // The shop's own weather: a blank fascia board, a canvas over the walk at shoulder height,
          // a valance at its edge, and — if the record names one — a noren in the recess head. The
          // units are the same unit; the variety is the canvas and the cloth, never the frame.
          /* Canvas and board keep a low `lit`: the sun is already adding its share on a day page,
             and a saturated cloth at lit 1.1 washes to pastel — the first awnings did. */
          Q([P(-half - 4, 4, yA), P(half + 4, 4, yA), P(half + 4, 4, m.h), P(-half - 4, 4, m.h)],
            m.fascia || "#b9ac8e", lit * 0.88);
          Q([P(-half, 10, yA), P(half, 10, yA), P(half, out, yB), P(-half, out, yB)], m.awn, lit * 0.78);
          // Stripes along the slope: a plain canvas reads as a lid, a striped one reads as a market.
          for (let i = 0; i < 6; i += 2) {
            const u0 = -half + (i / 6) * 2 * half, u1 = -half + ((i + 1) / 6) * 2 * half;
            Q([P(u0, 9, yA), P(u1, 9, yA), P(u1, out, yB), P(u0, out, yB)], mix(m.awn, 0.3), lit * 0.82);
          }
          Q([P(-half, out, yB - val), P(half, out, yB - val), P(half, out, yB), P(-half, out, yB)],
            m.awn, lit * 0.72);
          // The canvas throws a shadow home on the wall below it while the sun is up: the one
          // directional cue a shopfront can give without a shadow pass. Skips the lift, or the
          // sun would wash its own shadow away.
          if (DAY() > 0.05) {
            // The canvas's shadow slides down the wall as the sun climbs and leans with the
            // azimuth: a fixed shadow would be a decal of a shadow.
            const drop = 46 + (1 - sunNow()) * 60, lean = sunAz() * 24;
            const sh = add(C, [P(-half, 3 + lean, drop), P(half, 3 + lean, drop),
                               P(half, 3 + lean, yA - 4), P(-half, 3 + lean, yA - 4)],
                           ZERO8, "flat", `rgba(10,16,30,${(0.32 * DAY()).toFixed(3)})`);
            if (sh) { sh.day = false; sh.air = 0; drawn.push(sh); }
          }
          if (m.noren) {
            // Hung at the head of the doorway, below the canvas: under an awning the noren is the
            // shop's colour at eye level, and the one retail cue a walker meets face on.
            for (let i = 0; i < 5; i++) {
              const a0 = (i / 5) * 2 * half - half, a1 = ((i + 1) / 5) * 2 * half - half - 5;
              Q([P(a0, 12, 196), P(a1, 12, 196), P(a1, 12, 148), P(a0, 12, 148)],
                mix(m.noren, i % 2 ? -0.14 : 0.04), lit * 0.85);
            }
          }
        } else {
          // The proud closed front: recess, jambs, transom — a building with nobody in it.
          Q([P(-half, ins, 0), P(half, ins, 0), P(half, ins, m.h), P(-half, ins, m.h)], mix(base, -0.14), lit);
          Q([P(-half, ins, 0), P(half, ins, 0), P(half, ins, head * (0.34 + up * 0.66)),
             P(-half, ins, head * (0.34 + up * 0.66))], "#e8b87a", (0.7 + up * 1.15) * dl, 0.05);
          Q([P(-half, ins, head), P(half, ins, head), P(half, ins, m.h), P(-half, ins, m.h)], "#f0c98a",
            (1.35 + up * 0.5) * dl, 0.05);
          const bot = head * (1 - up * 0.95);
          if (head - bot > 2) {
            const blade = add(C, [P(-half, 8, bot), P(half, 8, bot), P(half, 8, head), P(-half, 8, head)],
                [m.z * DPM - half * DPM, -bot * DPM, m.z * DPM + half * DPM, -bot * DPM,
                 m.z * DPM + half * DPM, -head * DPM, m.z * DPM - half * DPM, -head * DPM],
                "pat", PATS.shutter);
            if (blade) { blade.lit = lit * 1.15; drawn.push(blade); }
          }
          Q([P(-half, 0, 0), P(-half, 0, head), P(-half, ins, head), P(-half, ins, 0)], mix("#4d5f5a", -0.3), lit * 0.6);
          Q([P(half, 0, 0), P(half, 0, head), P(half, ins, head), P(half, ins, 0)], mix("#4d5f5a", -0.3), lit * 0.6);
          Q([P(-half, 0, head), P(-half, ins, head), P(-half, ins, m.h), P(-half, 0, m.h)], mix("#4d5f5a", -0.06), lit * 0.8);
          Q([P(half, 0, head), P(half, ins, head), P(half, ins, m.h), P(half, 0, m.h)], mix("#4d5f5a", -0.06), lit * 0.8);
        }
      } else if (shape === "shopbay") {
        /* One bay of Nakamise's shop rows (round 32; the sources are in TODO §0n). Read off the map
           and the night photographs: the 1925 rows are shallow (about 4 m deep) and stand 9.1 m
           apart face to face. From the ground up a bay is a raised strip under the eave, the roll
           shutter (down once the shops shut, around 19:00, and painted since 1989 with the Asakusa
           Emaki), a lintel, an eave 150 cm deep with its strip light, the fascia band out at the
           post line, and the tiled roof edge, with a square vermilion post at the bay's edge. The
           mural's scenes have people in them, so only their ground colours are kept (`mural`), and
           the fascia, which carries each shop's name, is left blank. */
        const along = Math.abs(m.ry) > 45;
        const dir = along ? (m.x < 0 ? 1 : -1) : (m.z < 0 ? 1 : -1);
        const half = m.w / 2, D = m.d;
        const P = (u, v, y) => (along ? [m.x + dir * (v - D / 2), y, m.z + u]
                                      : [m.x + u, y, m.z + dir * (v - D / 2)]);
        const Q = (pts, col, l, air) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); }
          return q;
        };
        const rgba = (hex, a) =>
          `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})`;
        const ySt = 12, yS = m.h * 0.55, yE = m.h * 0.64, yF = m.h * 0.83, yR = m.h;
        const glowK = 0.45 + 0.55 * NIGHT();
        // The strip under the eave: a riser at the post line and a pale tiled walk.
        Q([P(-half, D, 0), P(half, D, 0), P(half, D, ySt), P(-half, D, ySt)], "#5c5954", lit * 0.8);
        Q([P(-half, 0, ySt), P(half, 0, ySt), P(half, D, ySt), P(-half, D, ySt)], "#aaa59b", lit * 0.95);
        // The shutter in the cladding's own slat tile, and the mural's ground laid over it in bands.
        const sp = [P(-half, 1, ySt), P(half, 1, ySt), P(half, 1, yS), P(-half, 1, yS)];
        const blade = along
          ? add(C, sp, [m.z * DPM - half * DPM, -ySt * DPM, m.z * DPM + half * DPM, -ySt * DPM,
                        m.z * DPM + half * DPM, -yS * DPM, m.z * DPM - half * DPM, -yS * DPM],
                "pat", PATS.shutter)
          : add(C, sp, ZERO8, "flat", "#8a8f96");
        if (blade) { blade.lit = lit * 1.1; drawn.push(blade); }
        const mural = m.mural && m.mural.length ? m.mural : [];
        mural.forEach((c, i) => {
          const y0 = ySt + (i / mural.length) * (yS - ySt);
          const y1 = ySt + ((i + 1) / mural.length) * (yS - ySt);
          Q([P(-half, 1.8, y0), P(half, 1.8, y0), P(half, 1.8, y1), P(-half, 1.8, y1)],
            rgba(c, 0.58), lit * 1.05);
        });
        // A shop is two or three shutters wide: the guides between them, and the bay's own edges.
        const NS = Math.max(1, Math.round(m.w / 180));
        for (let i = 0; i <= NS; i++) {
          const u = -half + (i / NS) * m.w;
          Q([P(u - 2, 2.4, ySt), P(u + 2, 2.4, ySt), P(u + 2, 2.4, yS), P(u - 2, 2.4, yS)],
            "#2f3036", lit * 0.8);
        }
        // Lintel and shutter box, then the eave's soffit with its strip light.
        Q([P(-half, 1, yS), P(half, 1, yS), P(half, 1, yE), P(-half, 1, yE)], "#5e2a22", lit * 0.85);
        Q([P(-half, 0, yE), P(half, 0, yE), P(half, D, yE), P(-half, D, yE)], "#d8d0bf", lit * 1.15);
        const strip = add(C, [P(-half + 6, 18, yE - 1), P(half - 6, 18, yE - 1),
                              P(half - 6, 30, yE - 1), P(-half + 6, 30, yE - 1)],
                          ZERO8, "flat", `rgba(255,243,220,${(0.5 + 0.45 * glowK).toFixed(3)})`);
        if (strip) { strip.lit = 1.5; strip.nolite = true; drawn.push(strip); }
        // The fascia at the post line: a pale board, ruled in vermilion top and bottom, unlettered.
        Q([P(-half, D, yE), P(half, D, yE), P(half, D, yF), P(-half, D, yF)], "#e6e1d5", lit * 0.98);
        Q([P(-half, D + 0.5, yE), P(half, D + 0.5, yE), P(half, D + 0.5, yE + 7), P(-half, D + 0.5, yE + 7)],
          "#a8352a", lit * 0.9);
        Q([P(-half, D + 0.5, yF - 7), P(half, D + 0.5, yF - 7), P(half, D + 0.5, yF), P(-half, D + 0.5, yF)],
          "#a8352a", lit * 0.9);
        // The tiled roof edge, running back up to the ridge line, and its lighter eave tiles.
        Q([P(-half, D + 4, yF), P(half, D + 4, yF), P(half, 0, yR), P(-half, 0, yR)], "#3b404a", lit * 0.72);
        Q([P(-half, D + 5, yF - 2), P(half, D + 5, yF - 2), P(half, D + 5, yF + 6), P(-half, D + 5, yF + 6)],
          "#59606b", lit * 0.8);
        // Where the row stops for a cross street, its end wall shows.
        const caps = m.posts === "2" ? [-half, half] : m.posts === "end" ? [half] : m.posts === "first" ? [-half] : [];
        caps.forEach((u) => Q([P(u, 0, 0), P(u, D, 0), P(u, D, yR * 0.86), P(u, 0, yR)], "#5a2620", lit * 0.7));
        // The posts: square, vermilion, standing on the strip at the bay's edge.
        const posts = m.posts === "2" ? [-half, half] : m.posts === "end" ? [-half, half] : [-half];
        posts.forEach((u) => {
          const pw = 11, v0 = D - 30, v1 = D - 8;
          [-1, 1].forEach((s) => Q([P(u + s * pw, v0, ySt), P(u + s * pw, v1, ySt), P(u + s * pw, v1, yE),
                                    P(u + s * pw, v0, yE)], "#922c22", lit * 0.85));
          Q([P(u - pw, v1, ySt), P(u + pw, v1, ySt), P(u + pw, v1, yE), P(u - pw, v1, yE)], "#b8392b", lit);
        });
      } else if (shape === "gate") {
        /* Kaminarimon from inside the precinct (round 32): the gate the lane is entered through and
           left by, 11.7 m tall and 11.4 m wide (Sensō-ji; Wikipedia). Its passage carries the great
           chōchin, 3.9 m tall and 3.3 m across, red with black bands over a metal base; here it says
           nothing, because its characters are writing. The bays either side hold the Tenryū and
           Kinryū figures behind grilles, and figures are not drawn, so the grilles are. */
        const dir = m.z < 0 ? 1 : -1;
        const half = m.w / 2, pass = Math.min(230, half * 0.52);
        const P = (u, y, v = 0) => [m.x + u, y, m.z + dir * v];
        const Q = (pts, col, l, air) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); }
          return q;
        };
        const n = NIGHT();
        /* The press area is the passage you walk out through, under the lantern -- not the whole gate.
           A gate this size fills the view when you turn back to it, and a press box is shown only while
           its corner is on screen, so a box round all of it was never shown: the way out vanished just
           when you faced it. Everything else is drawn but kept out of `drawn`, which is the press box. */
        const S = (pts, col, l) => { const q = add(C, pts, ZERO8, "flat", col); if (q) q.lit = l; return q; };
        // Beyond the passage: the street at night, so the end of the lane never shows through it.
        // Through the passage, the street outside at night: its lit ground, the warm band of its
        // shopfronts across the way, and the sky over them -- an opening, not a panel.
        Q([P(-pass, 0, -6), P(pass, 0, -6), P(pass, 250, -6), P(-pass, 250, -6)], "#2a2d3c", 0.7);
        S([P(-pass, 250, -6), P(pass, 250, -6), P(pass, m.h, -6), P(-pass, m.h, -6)], "#1c2438", 0.6);
        S([P(-pass, 0, -5), P(pass, 0, -5), P(pass, 46, -5), P(-pass, 46, -5)], "#6a6c78", 0.95);
        S([P(-pass, 60, -5), P(pass, 60, -5), P(pass, 190, -5), P(-pass, 190, -5)],
          `rgba(255,204,146,${(0.22 + 0.26 * n).toFixed(3)})`, 1.3);
        [-1, 1].forEach((s) => {
          const u0 = s * pass, u1 = s * half;
          S([P(u0, 0, -3), P(u1, 0, -3), P(u1, m.h * 0.84, -3), P(u0, m.h * 0.84, -3)], "#33191a", lit * 0.6);
          for (let i = 1; i < 10; i++) {
            const u = u0 + ((u1 - u0) * i) / 10;
            S([P(u - 2.5, 30, -1), P(u + 2.5, 30, -1), P(u + 2.5, m.h * 0.82, -1), P(u - 2.5, m.h * 0.82, -1)],
              "#7c3328", lit * 0.85);
          }
        });
        [-half, -pass, pass, half].forEach((u) =>
          S([P(u - 26, 0, 2), P(u + 26, 0, 2), P(u + 26, m.h, 2), P(u - 26, m.h, 2)], "#b8392b", lit));
        [[0.84, 0.89], [0.95, 1]].forEach(([a, b]) =>
          S([P(-half - 30, m.h * a, 3), P(half + 30, m.h * a, 3), P(half + 30, m.h * b, 3),
             P(-half - 30, m.h * b, 3)], "#a3342a", lit * 0.95));
        // The lantern: a barrel in seven slices, black-banded top and bottom, a metal ring beneath.
        const LH = 390, R = 165, lt = m.h * 0.94, lb = lt - LH, SL = 7;
        for (let i = 0; i < SL; i++) {
          const t0 = i / SL, t1 = (i + 1) / SL;
          const r0 = R * (0.84 + 0.16 * Math.sin(Math.PI * t0));
          const r1 = R * (0.84 + 0.16 * Math.sin(Math.PI * t1));
          const y0 = lb + t0 * LH, y1 = lb + t1 * LH;
          const col = t0 < 0.13 || t1 > 0.87 ? "#1d1917" : "#b4291e";
          [[-1, -0.38, -0.22], [-0.38, 0.38, 0.1], [0.38, 1, -0.22]].forEach(([a, b, k]) =>
            S([P(a * r0, y0, 8), P(b * r0, y0, 8), P(b * r1, y1, 8), P(a * r1, y1, 8)],
              mix(col, k), lit * (1.25 + 0.45 * n)));
        }
        S([P(-R * 0.86, lb - 22, 9), P(R * 0.86, lb - 22, 9), P(R * 0.86, lb, 9), P(-R * 0.86, lb, 9)],
          "#8a6a3c", lit);
      } else if (shape === "glass") {
        // A box you can see through: the frame first, then the panes at a fraction of the alpha an
        // opaque face would use, so the far side of the lane stays legible behind it. Painting glass
        // as a solid is the one way a booth reads as a cabinet.
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", "rgba(186,214,240,0.20)");
          if (q) { q.lit = lit; drawn.push(q); }
        });
        const top = add(C, [[m.x - m.w / 2, m.y + m.h, m.z - m.d / 2], [m.x + m.w / 2, m.y + m.h, m.z - m.d / 2],
                            [m.x + m.w / 2, m.y + m.h, m.z + m.d / 2], [m.x - m.w / 2, m.y + m.h, m.z + m.d / 2]],
                        ZERO8, "flat", mix("#5f6c80", 0.1));
        if (top) { top.lit = lit * 1.2; drawn.push(top); }
        // The door slides across its own opening rather than swinging: a hinge needs a second axis to
        // look right, and a painter engine with one depth sort gives a wrong answer the moment a
        // rectangle turns. Slid, it still reads as a door, and it never has to be occlusion-tested.
        const open = S && S.door ? S.door : 0;
        if (open > 0) {
          const dw = m.w * 0.46;
          const q = add(C, [[m.x - dw + open * dw * 1.9, m.y, m.z - m.d / 2 - 1],
                            [m.x + dw + open * dw * 1.9, m.y, m.z - m.d / 2 - 1],
                            [m.x + dw + open * dw * 1.9, m.y + m.h * 0.94, m.z - m.d / 2 - 1],
                            [m.x - dw + open * dw * 1.9, m.y + m.h * 0.94, m.z - m.d / 2 - 1]],
                        ZERO8, "flat", "rgba(150,186,218,0.28)");
          if (q) { q.lit = lit * 1.25; drawn.push(q); }
          const rail = add(C, [[m.x - dw + open * dw * 1.9, m.y, m.z - m.d / 2 - 2],
                              [m.x + dw + open * dw * 1.9, m.y, m.z - m.d / 2 - 2],
                              [m.x + dw + open * dw * 1.9, m.y + 6, m.z - m.d / 2 - 2],
                              [m.x - dw + open * dw * 1.9, m.y + 6, m.z - m.d / 2 - 2]],
                          ZERO8, "flat", "#7d8ba2");
          if (rail) { rail.lit = lit; drawn.push(rail); }
        }
      } else if (shape === "flap") {
        // A box, and a lid on its front: shut it is a rectangle, open it is a rectangle with a dark
        // mouth and a plate standing up behind it at an angle. Two quads decide the whole difference.
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix(base, f.k));
          if (q) { q.lit = lit; drawn.push(q); }
        });
        const open = S && S.flap ? S.flap > 0.5 : false;
        const fx = m.x + (m.x < 0 ? m.d / 2 : -m.d / 2);
        const mouth = add(C, [[fx, m.y + m.h * 0.42, m.z - m.w * 0.3], [fx, m.y + m.h * 0.42, m.z + m.w * 0.3],
                             [fx, m.y + m.h * 0.86, m.z + m.w * 0.3], [fx, m.y + m.h * 0.86, m.z - m.w * 0.3]],
                         ZERO8, "flat", open ? "#0a1120" : mix(base, -0.34));
        if (mouth) { mouth.lit = lit * (open ? 0.2 : 1); drawn.push(mouth); }
        if (open) {
          const lip = add(C, [[fx, m.y + m.h * 0.86, m.z - m.w * 0.3], [fx, m.y + m.h * 0.86, m.z + m.w * 0.3],
                             [fx + (m.x < 0 ? -18 : 18), m.y + m.h * 1.2, m.z + m.w * 0.3],
                             [fx + (m.x < 0 ? -18 : 18), m.y + m.h * 1.2, m.z - m.w * 0.3]],
                            ZERO8, "flat", mix(base, 0.16));
          if (lip) { lip.lit = lit * 1.2; drawn.push(lip); }
        }
      } else if (shape === "pane") {
        // A window at the height a lane sees a room at. The frame and sill are solid; behind the glass
        // is one lit plane and the edge of a curtain. Nothing is drawn further into that room than the
        // light that gets out of it, because a furnished interior would be inventing somebody's home.
        const along = Math.abs(m.ry) > 45;
        const dir = m.x < 0 ? 1 : -1;
        const half = m.w / 2, ins = m.d, slide = S && S.slide ? S.slide : 0;
        const y0 = m.y, y1 = m.y + m.h;
        const P = (u, v, y) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l, air) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); }
        };
        Q([P(-half, ins, y0), P(half, ins, y0), P(half, ins, y1), P(-half, ins, y1)],
          "#e2b377", 1.3 + slide * 0.5, 0.06);
        // The two panes, and the sash that slides: travelled all the way, the left one covers the
        // right one, which is what a window of this age does rather than folding away anywhere.
        const off = slide * half;
        [[-half + off, off], [0, half]].forEach(([ua, ub]) => {
          if (ub - ua < 2) return;
          const q = add(C, [P(ua, 7, y0 + 3), P(ub, 7, y0 + 3), P(ub, 7, y1 - 3), P(ua, 7, y1 - 3)],
                        ZERO8, "flat", "rgba(196,222,246,0.16)");
          if (q) { q.lit = lit * 1.15; drawn.push(q); }
        });
        [[-half - 7, -half + 3], [half - 3, half + 7]].forEach(([ua, ub]) => {
          Q([P(ua, 0, y0 - 4), P(ub, 0, y0 - 4), P(ub, 0, y1 + 4), P(ua, 0, y1 + 4)], mix(base, -0.16), lit);
        });
        Q([P(-half - 7, 0, y1), P(half + 7, 0, y1), P(half + 7, 12, y1 + 7), P(-half - 7, 12, y1 + 7)],
          mix(base, 0.08), lit * 1.1);
        Q([P(-half - 7, 0, y0 - 8), P(half + 7, 0, y0 - 8), P(half + 7, 0, y0), P(-half - 7, 0, y0)],
          mix(base, -0.06), lit * 0.95);
        const cu = -half + off * 0.4;
        Q([P(cu, ins - 4, y0 + m.h * 0.16), P(cu + m.w * 0.3, ins - 4, y0 + m.h * 0.16),
           P(cu + m.w * 0.3, ins - 4, y1), P(cu, ins - 4, y1)], "#8d5a52", lit * 0.85);
      } else if (shape === "bikes") {
        /* Round 56: a bicycle is two wheels and a diamond, and until now the diamond was a filled
           card 120 wide and 46 tall -- wider than the wheels it was supposed to sit between, so two
           bicycles leaning on a shutter read as two grey panels with black blobs. The frame is now
           the diamond a diamond frame is: seat tube, down tube, top tube, and the fork and chainstay
           as single strokes. The wheels keep their dark tyre and gain a rim, because the one thing
           that says "wheel" at twenty metres is a ring, not a disc. */
        const along = Math.abs(m.ry) > 45;
        const P = (xc, zc, u, y) => (along ? [xc, y, zc + u] : [xc + u, y, zc]);
        for (let b = 0; b < 2; b++) {
          const off = b ? m.w * 0.28 : -m.w * 0.22;
          const zc = along ? m.z + off : m.z;
          const xc = along ? m.x : m.x + off;
          const r = 33;
          for (const sx of [-42, 42]) {
            [[1, "#1b2436", 0.9], [0.74, "#0b111c", 0.55]].forEach(([k, col, l]) => {
              const pts = [];
              for (let i = 0; i < 10; i++) {
                const a0 = (i / 10) * 6.2832;
                pts.push(along ? [xc, m.y + r + Math.sin(a0) * r * k, zc + sx + Math.cos(a0) * r * 0.34 * k]
                               : [xc + sx + Math.cos(a0) * r * 0.34 * k, m.y + r + Math.sin(a0) * r * k, zc]);
              }
              const q = add(C, pts, ZERO8.slice(0, 20), "flat", col);
              if (q) { q.lit = lit * l; drawn.push(q); }
            });
          }
          /* A diamond is four strokes, not four filled wedges: each tube is a narrow quad along
             its own line, so the triangles between them stay open and the bicycle keeps the air
             that makes it read as a bicycle. */
          const steel = mix(base, 0.24);
          const tube = (a, bb, wid, col, l) => {
            const du = bb[0] - a[0], dy = bb[1] - a[1], len = Math.hypot(du, dy) || 1;
            const nu = (-dy / len) * wid / 2, ny = (du / len) * wid / 2;
            const q = add(C, [P(xc, zc, a[0] + nu, a[1] + ny), P(xc, zc, bb[0] + nu, bb[1] + ny),
                              P(xc, zc, bb[0] - nu, bb[1] - ny), P(xc, zc, a[0] - nu, a[1] - ny)],
                          ZERO8, "flat", col);
            if (q) { q.lit = lit * l; drawn.push(q); }
          };
          const BB0 = [4, 26], SEAT = [-14, 74], HEAD = [34, 72];
          tube([-42, r], BB0, 3.4, steel, 0.98);                 // chainstay to the bracket
          tube(BB0, SEAT, 3.4, steel, 1.02);                     // seat tube
          tube(SEAT, HEAD, 3.4, steel, 1.08);                    // top tube
          tube(BB0, HEAD, 4.0, steel, 1.04);                     // down tube
          tube(HEAD, [42, r], 3.2, mix(base, 0.12), 1.0);        // fork
          tube(SEAT, [-42, r], 3.0, mix(base, 0.06), 0.94);      // seat stay
          tube(SEAT, [-14, 88], 3.0, mix(base, 0.2), 1.05);      // seat post
          tube([-14, 88], [4, 88], 4.0, mix(base, 0.3), 1.1);    // saddle
          tube(HEAD, [30, 90], 3.0, mix(base, 0.2), 1.06);       // steerer
          tube([22, 90], [40, 88], 3.6, mix(base, 0.32), 1.12);  // the bars
        }
      } else if (shape === "planter") {
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix(base, f.k));
          if (q) { q.lit = lit; drawn.push(q); }
        });
        // what grows in it, three leaves deep: a lane with only grey in it is a drawing of a lane
        for (let i = 0; i < 3; i++) {
          const q = add(C, [[m.x - 26 + i * 22, m.y + m.h, m.z - 14 + i * 9],
                            [m.x - 4 + i * 22, m.y + m.h, m.z + 16 - i * 8],
                            [m.x + 8 + i * 16, m.y + m.h + 34 - i * 7, m.z + 4],
                            [m.x - 18 + i * 16, m.y + m.h + 26 - i * 6, m.z - 6]],
                        ZERO8, "flat", i % 2 ? "#3f5b3a" : "#4a6a41");
          if (q) { q.lit = lit * 0.9; drawn.push(q); }
        }
      } else if (shape === "island") {
        /* Low Toronto Islands at table scale: an irregular shoreline and rounded, layered landform,
           not the square tub and three triangular leaves of a street planter. The trees sit on the
           small flattened crowns authored in the Toronto record. */
        const N = 12, seed = m.x * 0.013 + m.z * 0.021;
        const irregularity = (a) => 0.91 + 0.055 * Math.sin(3 * a + seed) + 0.035 * Math.sin(5 * a - seed);
        const point = (a, rf, yf) => {
          const r = rf * irregularity(a);
          return [m.x + Math.cos(a) * m.w * 0.5 * r, m.y + m.h * yf,
                  m.z + Math.sin(a) * m.d * 0.5 * r];
        };
        const layers = [[0.02, 0.98], [0.18, 1.00], [0.56, 0.76], [0.84, 0.48]];
        for (let j = 0; j < layers.length - 1; j++) {
          const [y0, r0] = layers[j], [y1, r1] = layers[j + 1];
          const palette = j === 0 ? ["#a99a79", "#b8a988"]
                        : j === 1 ? ["#506548", "#5e744d"]
                        : ["#62784e", "#71855a"];
          for (let i = 0; i < N; i++) {
            const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
            const q = add(C, [point(a0, r0, y0), point(a1, r0, y0),
                              point(a1, r1, y1), point(a0, r1, y1)], ZERO8, "flat",
                          mix(palette[(i + j) % 2], (i % 3 - 1) * 0.045));
            if (q) { q.lit = lit * (j === 0 ? 0.78 : 0.92); drawn.push(q); }
          }
        }
        const crown = [];
        for (let i = 0; i < N; i++) crown.push(point((i / N) * Math.PI * 2, 0.48, 0.84));
        const top = add(C, crown, new Array(N * 2).fill(0), "flat", "#71855b");
        if (top) { top.lit = lit * 1.02; drawn.push(top); }
        // Small grass clearings break the crown into land rather than a uniform green cap.
        [[-0.22, -0.10, "#829064"], [0.16, -0.15, "#637b51"], [0.03, 0.20, "#7a8c5b"]]
          .forEach(([dx, dz, colour]) => {
            const x = m.x + dx * m.w, z = m.z + dz * m.d, y = m.y + m.h * 0.842;
            const q = add(C, [[x - 3.2, y, z - 1.8], [x + 2.5, y, z - 2.4],
                              [x + 3.4, y, z + 1.6], [x - 2.6, y, z + 2.2]],
                          ZERO8, "flat", colour);
            if (q) { q.lit = lit; drawn.push(q); }
          });
      } else if (shape === "cones") {
        for (let i = 0; i < 2; i++) {
          const cx = m.x + (i ? 20 : -20), cz = m.z + (i ? 8 : -6);
          const q = add(C, [[cx - 17, m.y, cz], [cx + 17, m.y, cz], [cx + 5, m.y + m.h, cz],
                            [cx - 5, m.y + m.h, cz]], ZERO8, "flat", mix(base, 0.1));
          if (q) { q.lit = lit; drawn.push(q); }
          const band = add(C, [[cx - 12, m.y + 34, cz - 1], [cx + 12, m.y + 34, cz - 1],
                               [cx + 9, m.y + 46, cz - 1], [cx - 9, m.y + 46, cz - 1]],
                           ZERO8, "flat", "#e6eaf0");
          if (band) { band.lit = lit * 1.3; drawn.push(band); }
        }
      } else if (shape === "aboard") {
        // A folding board: two faces at an angle, both blank, and the shadow they cast on each other.
        const q0 = add(C, [[m.x - m.w / 2, m.y, m.z - m.d / 2], [m.x + m.w / 2, m.y, m.z - m.d / 2],
                           [m.x + m.w / 2 - 6, m.y + m.h, m.z + 4], [m.x - m.w / 2 + 6, m.y + m.h, m.z + 4]],
                       ZERO8, "flat", mix(base, 0.12));
        if (q0) { q0.lit = lit; drawn.push(q0); }
        // Turning the board over is a swap of which face catches the light, and nothing else: it stays
        // blank on both sides, because that is the whole point of the object.
        const flip = S && S.flip ? 1 : 0;
        const q1 = add(C, [[m.x + m.w / 2, m.y, m.z + m.d / 2], [m.x - m.w / 2, m.y, m.z + m.d / 2],
                           [m.x - m.w / 2 + 6, m.y + m.h, m.z - 4], [m.x + m.w / 2 - 6, m.y + m.h, m.z - 4]],
                       ZERO8, "flat", mix(base, flip ? 0.12 : -0.28));
        if (q1) { q1.lit = lit * (flip ? 1.05 : 0.7); drawn.push(q1); }
        if (flip && q0) q0.lit = lit * 0.62;
      } else if (shape === "mirror") {
        /* A convex mirror on a bracket, which is the most Tokyo object a lane can hold and the only
           one here that turns. It is drawn, not silvered: there is nothing behind the glass in this
           scene, so it is a pale disc with one highlight and no reflection of any kind — a mirror
           that invented a reflection would be the renderer making something up.

           `turn` swings the whole disc about its bracket (up to 62 degrees) by rotating its plane: a
           point `u` along the disc moves in depth by `u·sinθ` and across by `u·cosθ`, so a stop is a
           change in the geometry rather than a caption on it, and the reach ring follows. */
        const dir = m.x < 0 ? 1 : -1;
        const r = Math.min(m.w, m.h) / 2, cy = m.y + m.h / 2;
        const turn = S && S.turn ? S.turn : 0;
        const th = turn * 1.082;                        // 62 degrees, as a fraction of a turn
        const st = Math.sin(th), ct = Math.cos(th);
        const P = (u, y, v) => [m.x + dir * (v + u * st), y, m.z + u * ct];
        const disc = (rad, off, col, l) => {
          const pts = [];
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * 6.2832;
            pts.push(P(Math.cos(a) * rad, cy + Math.sin(a) * rad, off));
          }
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; drawn.push(q); }
        };
        disc(r, 9, mix(base, -0.26), lit * 0.78);                  // the rim, 9 cm off the wall
        disc(r * 0.9, 6, "rgba(196,212,232,0.55)", lit * 0.9);     // the glass
        const hi = add(C, [P(-r * 0.52, cy + r * 0.34, 5), P(-r * 0.1, cy + r * 0.5, 5),
                           P(-r * 0.08, cy + r * 0.16, 5), P(-r * 0.44, cy + r * 0.02, 5)],
                      ZERO8, "flat", "rgba(255,246,224,0.34)");
        if (hi) { hi.lit = lit * 1.1; drawn.push(hi); }            // one highlight, and no image
        const arm = add(C, [P(-5, cy - 3, 0), P(5, cy - 3, 0), P(5, cy + 3, 0), P(-5, cy + 3, 0)],
                        ZERO8, "flat", mix(base, -0.3));
        if (arm) { arm.lit = lit * 0.6; drawn.push(arm); }         // the bracket it turns on
      } else if (shape === "ladder") {
        /* Two rails and five rungs, leaning out of the wall by `d` centimetres. A ladder is almost
           pure silhouette, which is exactly why it belongs in a lane that is otherwise all surface:
           it is the one prop whose whole reading is a rhythm of horizontals at an angle. */
        const dir = m.x < 0 ? 1 : -1;
        const along = Math.abs(m.ry) > 45;
        const rw = 5, lean = m.d;
        const P = (u, y, v) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        [-1, 1].forEach((sgn) => {
          const u = sgn * (m.w / 2 - rw / 2);
          const rail = add(C, [P(u - rw / 2, 0, lean), P(u + rw / 2, 0, lean),
                               P(u + rw / 2, m.h, 5), P(u - rw / 2, m.h, 5)],
                           ZERO8, "flat", mix(base, -0.22));
          if (rail) { rail.lit = lit; drawn.push(rail); }
        });
        for (let i = 1; i <= 5; i++) {
          const t = i / 5.6, y = m.h * t, v = lean + (5 - lean) * t;
          const rung = add(C, [P(-m.w / 2 + 2, y, v), P(m.w / 2 - 2, y, v),
                               P(m.w / 2 - 2, y + 5, v), P(-m.w / 2 + 2, y + 5, v)],
                           ZERO8, "flat", mix(base, 0.05));
          if (rung) { rung.lit = lit * 1.12; drawn.push(rung); }
        }
      } else if (shape === "bank") {
        /* A ploughed edge: two boxes of different lengths, the longer one lower, so the silhouette
           rises from the lane instead of standing on it like furniture. Snow is the one thing in
           these rooms that is drawn by its silhouette and its brightness rather than its material. */
        [[0, m.h * 0.55, m.d, 1], [m.h * 0.55, m.h * 0.45, m.d * 0.62, 0.86]]
          .forEach(([y0, h, d, wf]) => {
            facesOf({ ...m, y: m.y + y0, h, d, w: m.w * wf }).forEach((f) => {
              const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                           + f.n[2] * (C.z - f.p[0][2]);
              if (toward <= 0) return;
              const q = add(C, f.p, ZERO8, "flat", mix(base, f.k));
              if (q) { q.lit = lit * (y0 ? 1.12 : 1.0); drawn.push(q); }
            });
          });
      } else if (shape === "hydrant") {
        /* A standpipe at the kerb: it is three boxes and two caps, and the reason it earns its place is
           that it is recognisable as a silhouette at thirty metres. Nothing is claimed about water
           pressure or about anybody's fire. */
        [[0, m.h * 0.6, m.w, m.d, 0], [m.h * 0.6, m.h * 0.16, m.w * 0.74, m.d * 0.74, 0.12],
         [m.h * 0.76, m.h * 0.24, m.w * 0.4, m.d * 0.4, 0.2]].forEach(([y0, h, w, d, k]) => {
          facesOf({ ...m, y: m.y + y0, h: h, w: w, d: d }).forEach((f) => {
            const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                         + f.n[2] * (C.z - f.p[0][2]);
            if (toward <= 0) return;
            const q = add(C, f.p, ZERO8, "flat", mix(base, f.k + k + (lit - 0.7) * 0.2));
            if (q) { q.lit = lit; drawn.push(q); }
          });
        });
        const collar = add(C, [[m.x - m.d * 0.62, m.y + m.h * 0.42, m.z], [m.x + m.d * 0.62, m.y + m.h * 0.42, m.z],
                               [m.x + m.d * 0.62, m.y + m.h * 0.56, m.z], [m.x - m.d * 0.62, m.y + m.h * 0.56, m.z]],
                           ZERO8, "flat", mix(base, -0.24));
        if (collar) { collar.lit = lit * 0.9; drawn.push(collar); }
      } else if (shape === "camera") {
        /* The only lens in the lane, and it is drawn rather than implied: a body on a bracket, a lens
           looking down the lane, and a small light beside it whose glow is authored in the record as
           `of: camera`. Nothing is recorded by it and nothing in this lane is watched. */
        const dir = m.x < 0 ? 1 : -1;
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix(base, f.k));
          if (q) { q.lit = lit; drawn.push(q); }
        });
        const along = Math.abs(m.ry) > 45;
        const lensPts = along
          ? [[m.x + dir * 4, m.y + m.h * 0.22, m.z - 6], [m.x + dir * 4, m.y + m.h * 0.22, m.z + 6],
             [m.x + dir * 4, m.y + m.h * 0.78, m.z + 6], [m.x + dir * 4, m.y + m.h * 0.78, m.z - 6]]
          : [[m.x - 6, m.y + m.h * 0.22, m.z + dir * 4], [m.x + 6, m.y + m.h * 0.22, m.z + dir * 4],
             [m.x + 6, m.y + m.h * 0.78, m.z + dir * 4], [m.x - 6, m.y + m.h * 0.78, m.z + dir * 4]];
        const lens = add(C, lensPts, ZERO8, "flat", "rgba(24,32,48,0.8)");
        if (lens) { lens.lit = lit * 0.5; drawn.push(lens); }
      } else if (shape === "plate") {
        const q = add(C, [[m.x - m.w / 2, m.y + 1, m.z - m.d / 2], [m.x + m.w / 2, m.y + 1, m.z - m.d / 2],
                          [m.x + m.w / 2, m.y + 1, m.z + m.d / 2], [m.x - m.w / 2, m.y + 1, m.z + m.d / 2]],
                      ZERO8, "flat", base);
        if (q) { q.lit = lit * 0.5; drawn.push(q); }
      } else if (shape === "portal") {
        /* A tunnel's mouth in a side wall (round 33, Journey's branch to the portals): the opening
           is air -- the wall's `open` band -- and this paints its concrete reveal, two jambs with
           their returns and a head, so the press box is the opening you can see. */
        const side = m.x > 0 ? 1 : -1, px = side * (WALL - 1), hw = m.w / 2, dep = m.d;
        const col = mix(base, -0.05), ret = mix(base, -0.3);
        [[m.z - hw - 14, m.z - hw, m.z - hw], [m.z + hw, m.z + hw + 14, m.z + hw]].forEach(([z0, z1, zr]) => {
          const q = add(C, [[px, 0, z0], [px, 0, z1], [px, m.h, z1], [px, m.h, z0]], ZERO8, "flat", col);
          if (q) { q.lit = lit; drawn.push(q); }
          const r = add(C, [[px, 0, zr], [px + side * dep, 0, zr], [px + side * dep, m.h, zr], [px, m.h, zr]],
                        ZERO8, "flat", ret);
          if (r) { r.lit = lit * 0.8; drawn.push(r); }
        });
        /* The head is a lintel in the wall, under the wall's top. Round 35: where the opening rises
           to the vault's springing (Journey's branch) there is no wall over it to carry one -- the
           barrel is its head. A head laid there stood in the wall's plane behind the barrel's lowest
           chord, was painted in front of it anyway (a prop sorts by its own depth) and hung over the
           walker as a dark slab; moved under the springing it was a beam at eye height. */
        if (m.h + 12 <= WALL_TOP + 0.5) {
          const head = add(C, [[px, m.h, m.z - hw - 14], [px, m.h, m.z + hw + 14],
                               [px, m.h + 12, m.z + hw + 14], [px, m.h + 12, m.z - hw - 14]], ZERO8, "flat", col);
          if (head) { head.lit = lit; drawn.push(head); }
        }
        if (UNDER) drawn.forEach((q) => { q.nolite = true; });
      } else if (shape === "glassfloor") {
        /* A square of floor that is a window straight down: the city 342 m below rides the deep
           aerial tile behind a steel rim. The glass takes no wash from the room's lamps — its light
           is the city's, below, and a washed pane reads as grey floor (its first render, round 31,
           did exactly that when stepped on). `on` (step on) clears the reflection instead: standing
           over it you look through the glass, not at it — standing on it is the moment. */
        const on = S && S.on ? S.on : 0;
        const hw = m.w / 2, hd = m.d / 2;
        /* Round 33: on a page with a surveyed world the floor under the glass is a hole (see
           `holes` in the room loop) and the city really is down there -- the panel is then its
           steel frame and a faint pane, the units' joints between them. Without a world the
           old deep tile stands in, as it did. */
        if (bd && bd.world) {
          const pane = add(C, [[m.x - hw, m.y + 1, m.z - hd], [m.x + hw, m.y + 1, m.z - hd],
                               [m.x + hw, m.y + 1, m.z + hd], [m.x - hw, m.y + 1, m.z + hd]],
                           ZERO8, "flat", `rgba(170,195,225,${on ? 0.05 : 0.09})`);
          if (pane) { pane.air = 0; pane.day = false; pane.nolite = true; drawn.push(pane); }
          const n = Math.max(1, Math.round(m.w / 160));
          for (let k = 1; k < n; k++) {
            const jx = m.x - hw + (k * m.w) / n;
            const j = add(C, [[jx - 3, m.y + 2, m.z - hd], [jx + 3, m.y + 2, m.z - hd],
                              [jx + 3, m.y + 2, m.z + hd], [jx - 3, m.y + 2, m.z + hd]], ZERO8, "flat", "#2a3142");
            if (j) { j.lit = lit; drawn.push(j); }
          }
        } else {
          const q = add(C, [[m.x - hw, m.y + 1, m.z - hd], [m.x + hw, m.y + 1, m.z - hd],
                            [m.x + hw, m.y + 1, m.z + hd], [m.x - hw, m.y + 1, m.z + hd]], ZERO8, "flat", "#101826");
          if (q) { q.lit = 0.5; drawn.push(q); }
        }
        [[m.z - hd - 5, m.z - hd], [m.z + hd, m.z + hd + 5]].forEach(([z0, z1]) => {
          const r = add(C, [[m.x - hw - 5, m.y, z0], [m.x + hw + 5, m.y, z0],
                            [m.x + hw + 5, m.y + 3, z1], [m.x - hw - 5, m.y + 3, z1]],
                        ZERO8, "flat", "#3a4763");
          if (r) { r.lit = lit * 1.1; drawn.push(r); }
        });
        const sheen = add(C, [[m.x - hw, m.y + 2, m.z - hd], [m.x - hw * 0.2, m.y + 2, m.z - hd],
                              [m.x + hw * 0.2, m.y + 2, m.z + hd], [m.x - hw * 0.6, m.y + 2, m.z + hd]],
                          ZERO8, "flat", `rgba(210,228,248,${on ? 0.04 : 0.16})`);
        if (sheen) { sheen.air = 0; sheen.day = false; drawn.push(sheen); }
      } else if (shape === "plinth") {
        /* A diorama table: a dark cabinet whose top is the one face brighter than its own light —
           the lamp under the model shines up through it, and that glow is authored in the record.
           The sides stay in the hall's dark so the table reads as furniture, not a light box. */
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          if (f.n[1] !== 1) {
            const q = PATS.pedestal
              ? add(C, f.p, patUV(f), "pat", PATS.pedestal)
              : add(C, f.p, ZERO8, "flat", mix(base, f.k - 0.12));
            if (q) { q.lit = lit * 0.8; drawn.push(q); }
          }
        });
        // The top is four quads, not one lid: the spot over the table then paints a pool that
        // falls off toward the edges, which is the whole difference between a table and a box.
        const hx = m.w / 2, hz = m.d / 2;
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const x0 = m.x + (sx < 0 ? -hx : 0), x1 = m.x + (sx > 0 ? hx : 0);
          const z0 = m.z + (sz < 0 ? -hz : 0), z1 = m.z + (sz > 0 ? hz : 0);
          // The lid is the table's ground — city blocks, rock, cobbles or sand, whichever the
          // record authors — so the model stands on its terrain, not on a cream lid.
          // A stand for one built model (round 36) authors a plain board colour instead: a ground
          // tile at world scale under a 1:25 building would be paving stones a few metres across.
          const gq = m.top && PATS[m.top]
            ? add(C, [[x0, m.y + m.h, z0], [x1, m.y + m.h, z0], [x1, m.y + m.h, z1], [x0, m.y + m.h, z1]],
                  [x0 * DPM, z0 * DPM, x1 * DPM, z0 * DPM, x1 * DPM, z1 * DPM, x0 * DPM, z1 * DPM],
                  "pat", PATS[m.top])
            : add(C, [[x0, m.y + m.h, z0], [x1, m.y + m.h, z0], [x1, m.y + m.h, z1], [x0, m.y + m.h, z1]],
                  ZERO8, "flat", m.top && m.top.charAt(0) === "#" ? m.top : "#d9c9a6");
          if (gq) { gq.lit = lightAt((x0 + x1) / 2, m.y + m.h, (z0 + z1) / 2)
                             * (0.8 + 0.55 * NIGHT()); drawn.push(gq); }
        }
      } else if (shape === "tower") {
        /* CN Tower at table scale: a flared base, a genuinely tapered round shaft, the broad
           LookOut deck, the smaller SkyPod and the antenna. Twelve facets keep the silhouette
           circular without asking this canvas renderer to pretend a box is a cylinder. */
        const N = 12, radius = Math.min(m.w, m.d) * 0.5;
        const point = (r, a, yf) => [m.x + radius * r * Math.cos(a), m.y + m.h * yf,
                                     m.z + radius * r * Math.sin(a)];
        const band = (y0, y1, r0, r1, colour, brightness = 1, patterned = false, nolite = false) => {
          for (let i = 0; i < N; i++) {
            const a0 = (i / N) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
            const am = (a0 + a1) * 0.5, n = [Math.cos(am), 0, Math.sin(am)];
            if (n[0] * (C.x - m.x) + n[2] * (C.z - m.z) <= 0) continue;
            const pts = [point(r0, a0, y0), point(r0, a1, y0), point(r1, a1, y1), point(r1, a0, y1)];
            const fill = typeof colour === "function" ? colour(i) : colour;
            const q = patterned && PATS.towerc
              ? add(C, pts, patUV({ n, p: pts }), "pat", PATS.towerc)
              : add(C, pts, ZERO8, "flat", fill);
            if (q) {
              q.lit = typeof brightness === "function" ? brightness(i) : brightness;
              if (nolite) q.nolite = true;
              drawn.push(q);
            }
          }
        };
        const cap = (yf, r, colour, brightness = 1) => {
          const pts = [];
          for (let i = 0; i < N; i++) pts.push(point(r, (i / N) * Math.PI * 2 - Math.PI / 2, yf));
          const q = add(C, pts, new Array(N * 2).fill(0), "flat", colour);
          if (q) { q.lit = brightness; drawn.push(q); }
        };

        // Concrete base and shaft. The shaft narrows as it rises instead of keeping a box section.
        band(0.00, 0.12, 0.50, 0.34, mix(base, -0.18), lit * 0.95);
        band(0.12, 0.58, 0.34, 0.17, mix(base, -0.03), lit, true);
        band(0.57, 0.625, 0.17, 0.44, mix(base, -0.14), lit * 0.9);

        // The main observation deck is a broad, faceted ring, not a square box around the shaft.
        band(0.625, 0.642, 0.45, 0.46, "#35475b", lit * 0.95);
        const mainGlass = (i) => `rgba(255,205,132,${(0.26 + 0.55 * NIGHT() +
          (ease ? 0.08 * Math.sin(T * 0.8 + i * 0.55) : 0)).toFixed(2)})`;
        band(0.642, 0.696, 0.46, 0.45, mainGlass, (i) => 1.18 + 0.5 * NIGHT(), false, true);
        band(0.696, 0.712, 0.45, 0.42, "#394b60", lit * 0.9);
        band(0.712, 0.738, 0.42, 0.29, mix(base, -0.06), lit * 0.92);
        cap(0.738, 0.29, "#46586b", lit * 0.95);

        // The smaller SkyPod and the long antenna above it remain separate in the silhouette.
        band(0.738, 0.754, 0.29, 0.30, "#36495c", lit * 0.95);
        const skyGlass = (i) => `rgba(255,216,157,${(0.22 + 0.52 * NIGHT() +
          (ease ? 0.07 * Math.sin(T * 0.7 + i * 0.7) : 0)).toFixed(2)})`;
        band(0.754, 0.787, 0.30, 0.29, skyGlass, 1.3 + 0.35 * NIGHT(), false, true);
        band(0.787, 0.802, 0.29, 0.23, "#3b4d61", lit * 0.92);
        band(0.802, 0.965, 0.055, 0.033, mix(base, 0.02), lit * 1.05, true);
        band(0.965, 0.992, 0.033, 0.012, mix(base, 0.10), lit * 1.1);

        // The aircraft warning light has a small ring, so it is visible from more than one facing.
        const blink = ease ? (Math.sin(T * 2.4) > 0.2 ? 0.9 : 0.18) : 0.62;
        band(0.992, 1.00, 0.021, 0.021, `rgba(255,72,56,${blink.toFixed(2)})`, 1.7, false, true);
        const halo = add(C, [[m.x - 16, m.y + m.h - 22, m.z - 1], [m.x + 16, m.y + m.h - 22, m.z - 1],
                             [m.x + 16, m.y + m.h + 8, m.z - 1], [m.x - 16, m.y + m.h + 8, m.z - 1]],
                         ZERO8, "flat", `rgba(255,86,64,${(blink * 0.24).toFixed(3)})`);
        if (halo) { halo.lit = 1.5; drawn.push(halo); }
      } else if (shape === "skyline") {
        const faceToward = (f) => f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                                + f.n[2] * (C.z - f.p[0][2]) > 0;
        if (m.towers && m.towers.length) {
          /* Real towers (round 32): the record names each one with its height from the sources at
             the table's scale and its cladding colour, in the order the downtown stands seen from
             the lake. Floors read as bands, and after dusk the bands are lit windows. A tower whose
             crown is its signature carries it (`crown: "v"`, Scotia Plaza's notched top). */
          m.towers.forEach((t, bi) => {
            const tm = { ...m, x: m.x + (t.dx || 0), z: m.z + (t.dz || 0), w: t.w, d: t.d || t.w, h: t.h };
            facesOf(tm).forEach((f) => {
              if (!faceToward(f)) return;
              const q = add(C, f.p, ZERO8, "flat", mix(t.c, f.k + (lit - 0.7) * 0.2));
              if (q) { q.lit = lit; drawn.push(q); }
              if (f.n[1] === 1) return;
              const [a, b, c2, d2] = f.p;       // a,b at the foot; c2,d2 at the head
              const at = (p0, p1, k) => [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k,
                                         p0[2] + (p1[2] - p0[2]) * k];
              const nb = Math.max(4, Math.round(t.h / 14));
              const on = NIGHT();
              for (let i = 1; i < nb; i++) {
                const k0 = i / nb, k1 = k0 + 0.42 / nb;
                const lo0 = at(a, d2, k0), lo1 = at(b, c2, k0), hi1 = at(b, c2, k1), hi0 = at(a, d2, k1);
                const lt = 0.18 + 0.5 * on * (0.6 + 0.4 * Math.sin(bi * 1.7 + i * 2.3 + Math.floor(T * 0.2)));
                const bq = add(C, [lo0, lo1, hi1, hi0], ZERO8, "flat",
                               on > 0.35 ? `rgba(255,224,170,${lt.toFixed(3)})` : "rgba(24,30,44,0.46)");
                if (bq) { bq.lit = on > 0.35 ? 1.3 : lit; if (on > 0.35) bq.nolite = true; drawn.push(bq); }
              }
              if (t.crown === "v") {
                const top0 = at(a, d2, 0.94);
                const mid = at(at(a, b, 0.5), at(d2, c2, 0.5), 1);
                const notch = add(C, [d2, [mid[0], top0[1], mid[2]], c2], new Array(6).fill(0), "flat",
                                  mix(t.c, -0.45));
                if (notch) { notch.lit = lit; drawn.push(notch); }
              }
            });
          });
        } else {
          /* The generic row, kept for any record that has not named its towers. */
          const blocks = [[-0.36, 0.55, 0.3, -0.1], [-0.1, 0.95, 0.32, 0.12], [0.16, 0.7, 0.3, -0.06],
                          [0.4, 0.5, 0.26, 0.08]];
          blocks.forEach(([cx, hf, wf, dz], bi) => {
            facesOf({ ...m, x: m.x + cx * m.w, z: m.z + dz * m.d, h: m.h * hf, w: m.w * wf,
                      d: m.d * 0.5 }).forEach((f) => {
              if (!faceToward(f)) return;
              const win = f.n[1] !== 1
                ? PATS[(NIGHT() > 0.45 ? "skyn" : "sky") + ((bi + Math.floor(T * 0.7)) % 3)]
                : null;
              const q = win
                ? add(C, f.p, patUV(f), "pat", win)
                : add(C, f.p, ZERO8, "flat", mix(base, f.k + (lit - 0.7) * 0.2));
              if (q) { q.lit = win ? Math.max(lit, 0.9) : lit; if (win) q.nolite = true; drawn.push(q); }
            });
          });
        }
      } else if (shape === "dome") {
        /* Rogers Centre: an oval stadium bowl with seating around a baseball field, under a roof of
           four panels (round 32 correction; Wikipedia). The north panel is fixed; the two middle
           panels slide north and stack over it, and the south semicircular panel rotates round the
           stadium and nests inside the stack, so an open roof is a stack at the north end and the
           field open to the south. The first build slid two halves apart east and west, which is a
           roof, but not this one. The real move takes twenty minutes; the hall plays it in a few
           seconds, the way it plays its day. */
        const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
        const cyc = (T / 42) % 1;
        const op = !ease ? 0 : cyc < 0.12 ? sm(cyc / 0.12)
                 : cyc < 0.46 ? 1
                 : cyc < 0.58 ? sm(1 - (cyc - 0.46) / 0.12) : 0;
        const along = Math.abs(m.ry) > 45, N = 16;
        const ax = m.w * 0.5, bz = m.d * 0.5;
        // u runs east-west, v south (-) to north (+), as the table is laid out.
        const P = (u, v, yf) => along
          ? [m.x + v, m.y + m.h * yf, m.z + u]
          : [m.x + u, m.y + m.h * yf, m.z + v];
        const ep = (a, ru, rv, yf) => P(Math.cos(a) * ax * ru, Math.sin(a) * bz * rv, yf);
        const wall = (y0, y1, ru0, rv0, ru1, rv1, colour, brightness = lit) => {
          for (let i = 0; i < N; i++) {
            const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
            const am = (a0 + a1) * 0.5;
            const n = along ? [Math.sin(am), 0, Math.cos(am)] : [Math.cos(am), 0, Math.sin(am)];
            if (n[0] * (C.x - m.x) + n[2] * (C.z - m.z) <= 0) continue;
            const pts = [ep(a0, ru0, rv0, y0), ep(a1, ru0, rv0, y0),
                         ep(a1, ru1, rv1, y1), ep(a0, ru1, rv1, y1)];
            const fill = typeof colour === "function" ? colour(i) : colour;
            const q = add(C, pts, ZERO8, "flat", fill);
            if (q) { q.lit = typeof brightness === "function" ? brightness(i) : brightness; drawn.push(q); }
          }
        };
        const ring = (yf, ruO, rvO, ruI, rvI, colour, brightness = lit) => {
          for (let i = 0; i < N; i++) {
            const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
            const pts = [ep(a0, ruO, rvO, yf), ep(a1, ruO, rvO, yf),
                         ep(a1, ruI, rvI, yf), ep(a0, ruI, rvI, yf)];
            const q = add(C, pts, ZERO8, "flat", typeof colour === "function" ? colour(i) : colour);
            if (q) { q.lit = typeof brightness === "function" ? brightness(i) : brightness; drawn.push(q); }
          }
        };
        const disc = (yf, ru, rv, colour, brightness = lit) => {
          const pts = [];
          for (let i = 0; i < N; i++) pts.push(ep((i / N) * Math.PI * 2, ru, rv, yf));
          const q = add(C, pts, new Array(N * 2).fill(0), "flat", colour);
          if (q) { q.lit = brightness; q.nolite = true; drawn.push(q); }
        };
        // Concrete drum, shallow stepped seating bowl, and a readable field at the bottom.
        wall(0.00, 0.28, 0.49, 0.47, 0.49, 0.47, (i) => i % 2 ? "#596575" : "#647080", lit * 0.72);
        wall(0.27, 0.45, 0.45, 0.43, 0.19, 0.17, (i) => i % 3 ? "#354457" : "#46586c", lit * 0.64);
        ring(0.29, 0.49, 0.47, 0.43, 0.41, "#b2b8bc", lit * 0.9);
        ring(0.32, 0.43, 0.41, 0.38, 0.36, "#56657a", lit * 0.78);
        ring(0.36, 0.38, 0.36, 0.33, 0.31, "#7d514b", lit * 0.74);
        ring(0.40, 0.33, 0.31, 0.28, 0.26, "#475970", lit * 0.82);
        ring(0.44, 0.28, 0.26, 0.21, 0.19, "#647287", lit * 0.86);
        disc(0.455, 0.21, 0.19, "#477246", 0.95 + 0.35 * NIGHT() + 0.18 * op);
        // The stationary roof ring the panels ride on.
        wall(0.47, 0.53, 0.49, 0.47, 0.49, 0.47, "#394a5a", lit * 0.9);
        const roofY = (u, v) => 0.535 + 0.19 *
          Math.pow(Math.max(0, 1 - (u / ax) ** 2), 0.62) *
          Math.pow(Math.max(0, 1 - (v / bz) ** 2), 0.55);
        /* One panel: its own patch of the closed roof (v0..v1), then moved — slid north by `dv`, or
           turned about the stadium's centre by `rot` — and lifted by `lift` so the stack reads as a
           stack. Its height follows the closed roof where it came from, which is what a panel is. */
        const NU = 6, NV = 3;
        const panel = (v0, v1, dv, rot, lift, tone) => {
          const cr = Math.cos(rot), sr = Math.sin(rot);
          // The panel rides the roof's own curve wherever it has got to, lifted by its place in the stack.
          const at = (u, v) => {
            const uu = u * cr - v * sr, vv = u * sr + v * cr + dv;
            return P(uu, vv, roofY(uu, Math.min(bz, Math.max(-bz, vv))) + lift);
          };
          for (let i = 0; i < NU; i++) {
            const u0 = -ax + (i / NU) * 2 * ax, u1 = -ax + ((i + 1) / NU) * 2 * ax;
            for (let j = 0; j < NV; j++) {
              const va = v0 + (j / NV) * (v1 - v0), vb = v0 + ((j + 1) / NV) * (v1 - v0);
              // keep to the oval: a panel corner outside the drum is pulled in to its rim
              const cl = (u, v) => {
                const r = Math.hypot(u / ax, v / bz);
                return r > 0.985 ? [u * 0.985 / r, v * 0.985 / r] : [u, v];
              };
              const [pu0, pv0] = cl(u0, va), [pu1, pv1] = cl(u1, va), [pu2, pv2] = cl(u1, vb), [pu3, pv3] = cl(u0, vb);
              const q = add(C, [at(pu0, pv0), at(pu1, pv1), at(pu2, pv2), at(pu3, pv3)], ZERO8, "flat",
                            mix(tone, ((i + j) % 2) ? 0.02 : -0.08));
              if (q) { q.lit = lit * 0.92; drawn.push(q); }
            }
          }
        };
        // North panel, fixed; south panel turning half a circle onto it; the middle pair sliding north.
        panel(bz * 0.5, bz, 0, 0, 0, "#87939c");
        panel(-bz, -bz * 0.5, 0, Math.PI * op, 0.012 * op, "#8d989f");
        panel(0, bz * 0.5, bz * 0.5 * op, 0, 0.024 * op, "#848f98");
        panel(-bz * 0.5, 0, bz * op, 0, 0.036 * op, "#808b94");
      } else if (shape === "falls" && m.drop) {
        /* Round 58: everything this branch draws is water, and water opts out of the lane's
           daylight wash. The shader adds a warm sun term to every quad that does not say
           `day: false`, and on a teal curtain that term is the grey wall the owner called 一片平光 —
           it was the *lighting*, not the colour. Captured by index so every quad the branch pushes
           (sheet, ropes, seams, lip, foot, mist) is covered without a list to keep in sync. */
        const fromHere = drawn.length;
        /* Round 58: the falls as a brink, not as a wall.

           The table model further down is right for a diorama you can walk round. In a lane it was
           wrong in one decisive way: it stood a sheet of water on the ground, so a visitor eight
           metres from the American Falls looked at a hundred metres of water standing upright and
           the frame filled with stripes. A falls seen from a bank is not a wall in front of you —
           it is water at your feet, a white lip, and then the river going away underneath. So a
           `drop` falls is built the other way up: the crest lies at the prop's own height, the
           sheet hangs *below* it into the gorge, the brink is a strip of water between the lane and
           the crest, and the spray comes back up over the lip.

           What the visitor sees from the edge, in order: the brink and its ripple, the lip line,
           the descending sheet with its strands running down it (a texture scrolled by the frame
           clock, so the motion is the walker's, as everything moving here is), the headlands either
           side, and the mist climbing back past the crest. */
        const along = Math.abs(m.ry) > 45;                 // the crest runs down the lane
        const away = along ? (m.x < 0 ? -1 : 1) : (m.z < 0 ? -1 : 1);   // downstream, off the lane
        const hw = m.w / 2, drop = m.h, crestY = m.y;
        /* The strands' scale. A UV count of 1 is one tile, so this is centimetres of sheet per
           tile: at 250 the ropes are half a metre to a metre and a half across, which is what a
           curtain of water hangs in when you are standing twenty metres back from it. (The
           pattern tiles themselves are 128 units wide and `DPM` 2 makes a brick 64 cm — that is
           why the paving uses its own scale; the water's UVs are divided out here directly.) */
        const Pt = (a, y, t) => along ? [m.x + away * t, y, m.z + a]
                                      : [m.x + a, y, m.z + away * t];
        /* The sheet moves without the visitor moving. The strands travel down a tile every 1.7 s
           on the frame clock — the same clock that lights the lamps and turns the wheel, so a
           frame rate this machine cannot hold never changes how fast the water falls. */
        const Q = (a0, a1, y0, y1, t0, t1, col, l, air) => {
          const q = add(C, [Pt(a0, y0, t0), Pt(a1, y0, t1), Pt(a1, y1, t1), Pt(a0, y1, t0)],
                        ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); return q; }
          return null;
        };
        // A strip of water lying flat (the brink and the pool): four corner offsets across the
        // crest and out from it, at one height. `Q` folds two of those corners onto each other.
        const H = (a0, a1, t0, t1, y, col, l, air) => {
          const q = add(C, [Pt(a0, y, t0), Pt(a1, y, t0), Pt(a1, y, t1), Pt(a0, y, t1)],
                        ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); return q; }
          return null;
        };
        /* The brink: the river coming at you over the flat before it goes. Two steps of colour and
           a ripple that travels, because still water at a brink is the one thing a falls never is. */
        /* The river coming at the brink. It runs from the walk's own edge to the lip, so the
           visitor stands with the water at their feet — the one view every photograph taken on this
           bank has, and the reason a falls is not a picture of a wall. */
        /* Round 58: the water between the visitor and the lip.
           It was three 30 cm strips — bands a step apart, with the ground showing through between
           them, which reads as paint rather than as a river. It is one continuous surface now, cut
           into bands only so the ripples can travel at slightly different speeds: the current comes
           at you at three speeds, which is what a brink looks like just before it goes. */
        /* The water's near edge is the lane's own edge, not a fixed 40 cm: at 40 the river ran
           under the paving and the visitor stood on its lid. `HALF` is the free half-width the body
           may occupy, so the brink starts a hand's width beyond it. */
        const edge = HALF + 8;
        /* Round 58: the upper river lies on the *far* side of the lip. It used to run from the
           crest all the way back to the visitor, and that is a contradiction the frame could not
           survive: a plane of water at the crest's own height, between the eye and the sheet,
           covers the entire drop — it was the flat teal wash in every screenshot. What is between
           the visitor and the falls is the channel, below the crest, and it is its own prop. So
           the brink is authored outward only: fourteen metres of river above the lip, enough to
           read as water arriving rather than as an edge of the drawing. */
        /* Round 58, fifth pass: fourteen metres of upper river seen from 25 m is a *ninety-pixel*
           band of pale grey above the lip — the last flat horizontal thing in the frame, and the
           reason the brink still read as a slab. The real American Falls gives you about four metres
           of water above the brink before the ground takes it; four is what this draws now, and the
           foam streaks carry the sense of arrival the extra ten metres were pretending to. */
        const reach = 420;
        const NBR = 4;
        for (let i = 0; i < NBR; i++) {
          const t0 = (i / NBR) * reach, t1 = ((i + 1) / NBR) * reach;
          const q = add(C, [Pt(-hw, crestY + 1, -t0), Pt(hw, crestY + 1, -t0),
                            Pt(hw, crestY + 1, -t1), Pt(-hw, crestY + 1, -t1)],
                        [0, 0, hw * 2 / 260, 0, hw * 2 / 260, (t1 - t0) / 260, 0, (t1 - t0) / 260],
                        "pat", PATS.rapids);
          /* Round 58: this river was drawn at 0.88-0.98 `lit`, and `lit` washes a colour toward
             the day's light — so the fourteen metres of water between the visitor and the lip came
             out the colour of concrete, which is the last flat thing in this frame. The river above
             a falls is the darkest water on the page: it is deep, it is moving, and it is about to
             stop being a river. */
          if (q) { q.lit = 0.46 + 0.10 * (i / NBR); q.air = 0.02; drawn.push(q); }
        }
        /* The water arriving, drawn as arrival: streaks of foam travelling toward the lip on the
           frame clock, faster as they get closer (a river accelerates into its own drop), and a
           standing boil where it breaks. Without these the brink is a painted plane seen edge-on. */
        for (let i = 0; i < 9; i++) {
          const a = -hw * 0.94 + (i / 8) * hw * 1.88;
          const w = 90 + (i % 4) * 70;
          for (let k = 0; k < 3; k++) {
            const phase = ease ? ((T * 0.42 + k / 3 + i * 0.17) % 1) : (k / 3);
            const t = -reach * 0.92 * (1 - phase);          // from upstream toward the lip
            const len = 120 + 260 * phase;                   // stretches as it accelerates
            const q = add(C, [Pt(a - w, crestY + 3, t), Pt(a + w, crestY + 3, t),
                              Pt(a + w * 0.7, crestY + 3, t + len), Pt(a - w * 0.7, crestY + 3, t + len)],
                          ZERO8, "flat", `rgba(226,244,243,${(0.06 + 0.12 * phase).toFixed(3)})`);
            if (q) { q.lit = 0.9; q.air = 0.0; drawn.push(q); }
          }
        }
        for (let i = 0; i < 7; i++) {
          const a = -hw * 0.86 + (i + 0.5) * (hw * 1.72 / 7);
          const ph = ease ? Math.sin(T * 1.1 + i * 1.7) : 0;
          const b0 = Pt(a - 34, crestY + 2, -64 + ph * 6), b1 = Pt(a + 34, crestY + 2, -64 + ph * 6);
          const b2 = Pt(a + 26, crestY + 2, -30 + ph * 4), b3 = Pt(a - 26, crestY + 2, -30 + ph * 4);
          const q = add(C, [b0, b1, b2, b3], ZERO8, "flat", `rgba(238,250,250,${(0.16 + (i % 3) * 0.05).toFixed(2)})`);
          if (q) { q.lit = 1.1; drawn.push(q); }
        }
        /* The lip: the unbroken white line every falls has where the water breaks over. Without it
           the sheet's top edge is a cut, which is what "a striped wall" looked like. */
        Q(-hw, hw, crestY - 6, crestY + 3, 0, 0, "#f2fbfa", 1.35, 0.02);
        H(-hw, hw, -22, 0, crestY + 2, "rgba(240,250,250,0.5)", 1.2, 0.02);
        /* The white water at the lip: a real falls spends its first several metres as foam, not as
           its own deep teal. One band, in front of the sheet by 3 cm so the sorter cannot put the
           sheet over it, and it fades down into the first break instead of stopping at a seam. */
        /* The white water at the lip. Round 58's fourth pass: this was two bands, 59 cm and 138 cm
           tall, drawn at 0.55 alpha over the full crest — and because the top of the sheet is the
           part nearest the camera, those 138 cm projected as a fifty-pixel stripe of pale grey
           across the whole frame, the last flat thing left in the picture. A falls breaks white for
           about a metre and then fogs into strands; one narrow band, and the strands below it carry
           the rest. */
        Q(-hw, hw, crestY - drop * 0.055, crestY - 1, 0, 0, "#f4fbfa", 1.3, 0.02);
        Q(-hw, hw, crestY - drop * 0.135, crestY - drop * 0.050, -3, -3, "rgba(228,247,246,0.46)", 1.15, 0.02);
        Q(-hw, hw, crestY - drop * 0.225, crestY - drop * 0.130, -5, -5, "rgba(214,240,240,0.26)", 1.05, 0.02);
        /* The sheet, in the source's four bands, with its strands sliding down it. Each band is a
           tone; over each tone a translucent strand quad travels at the frame clock's rate. That is
           the whole near-field difference: colour that holds still and water that does not. */
        /* The curtain's four bands, authored from the foot up: the water is deepest at the lip and
           breaks into white as it falls, so the *pale* end of the sheet is at the bottom, where it
           lands, not at the top. Round 58 had these the other way round (pale at the crest), which
           is why a twenty-metre fall read as a sheet of fog hung from the sky. */
        /* The curtain's tone from the lip down, as a continuous ramp rather than four bands.

           Round 58's fifth pass: four authored bands is four steps of colour, and at the brink a
           visitor's eye lands on those steps as horizontal stripes — the same "striped wall" the
           owner has been reporting since round 57, only now in the right colour. Water does not band.
           Ten steps of a blend between the lip's deep teal and the foot's pale one is smooth enough
           that only the noise across the crest reads. */
        const BANDS = [];
        const NB = 44;
        const bt = (v) => 1 - (1 - v) ** 1.6;      // slice edges crowd toward the foot
        for (let i = 0; i < NB; i++) {
          const a = bt(i / NB), b = bt((i + 1) / NB);
          // The curve is not linear: the water stays deep most of the way and pales at the foot.
          const t = Math.max(0, (a - 0.22) / 0.78) ** 1.6;
          /* Round 58, sixth pass — the palette. A falls is *aerated water*: the sheet is nearly white
             over most of its face and the teal is what you see *between* the ropes, where the water
             is still water. Round 57 painted it the other way round (teal sheet, dark seams) and that
             is why every close frame read as a painted wall. The sheet is now the pale half of the
             pair and the seams carry all the colour. */
          BANDS.push([a, b, blendHex("#a7cfc9", "#eaf6f4", t)]);
        }
        const NA = 12;
        const bow = (a) => drop * 0.012 * Math.max(0, 1 - (a / (hw * 0.88)) ** 2);
        const throwAt = (p) => drop * 0.035 * Math.sqrt(p);
        /* Round 58, sixth pass — the base course is gone.

           This used to lay twelve broad slices of the gradient first, and it was those twelve
           rectangles that the owner kept seeing as 一片平光: each slice is thirty bands tall and a
           twelfth of the crest wide, so once the ropes were drawn into the same plane the slice
           behind a rope won the depth sort half the time and painted its own flat rectangle over
           the rope's tone. Two layers of the same water is one layer too many. The ropes carry the
           gradient themselves now — `col` still comes from BANDS below — and the seams between them
           are what the eye reads as water lines. */
        /* The ropes.

           Round 58's decisive finding: a texture cannot draw this. The sheet is fifteen metres from
           the rail and forty degrees of frame covers it, so one centimetre of water is well under a
           pixel — a strand tile mips down to its own mean and the curtain becomes the flat wash
           the owner called 一片平光. What survives at that distance is *shape*, not grain: the
           curtain hangs in ropes a metre or two wide, and the dark water between two ropes shows
           through. So the ropes are drawn as geometry, each column a tone in its own right, and
           each rope carries a slow travelling brightness down its length — the water moving, drawn
           where it can actually be seen.

           Forty-eight columns over the crest: at the American Falls' 290 m of real crest measured
           at this page's scale that is a rope every couple of metres, which is what the photographs
           of the fall from Terrapin Point show. */
        const NCOL = 48;
        /* Round 58, second pass: the ropes were all the same width at even spacing, and forty-eight
           equal stripes read as a bead curtain, not as water. The boundaries are jittered by a seeded
           hash (so the fall is the same every frame and every visit), and each rope's seam is its own
           width. Water does not divide evenly. */
        const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
        const B = (i) => -hw + hw * 2 * ((i + 0.55 * (hash(i) - 0.5)) / NCOL);
        const nightK = NIGHT();
        for (let k = 0; k < NCOL; k++) {
          const a0 = B(k), a1 = B(k + 1), ac = (a0 + a1) / 2, aw = a1 - a0;
          // Which column this is decides its water: a slow standing pattern across the crest,
          // seeded so it is the same every frame — the fall does not reshuffle when you look away.
          const sway = 0.74 + 0.26 * Math.sin(k * 1.7) * Math.cos(k * 0.61 + 0.4);
          /* Round 58, sixth pass: three grades of water per rope, not two. A falls seen close is
             mostly white water with a few dark ropes in it — the dark ones are where the sheet is
             still thick and has not broken. Before this every rope sat within eight per cent of its
             neighbours' tone, and forty-eight near-identical columns is a curtain of paint. */
          const bright = sway > 0.885;                  // broken, aerated, almost white
          const dark = sway < 0.66;                     // still unbroken water
          const rope = sway > 0.80 && !bright;
          const ph = (k * 0.37) % 1;
          for (const [fa, fb, col] of BANDS) {
            const y0 = crestY - drop * fa, y1 = crestY - drop * fb;
            const t0 = throwAt(fa) + bow(a0), t1 = throwAt(fb) + bow(a0);
            const t2 = throwAt(fb) + bow(a1), t3 = throwAt(fa) + bow(a1);
            /* A rope's brightness travels down it: `droplet` is where the white is, and it drops a
               fall's own height every four seconds. Without it the curtain is a still photograph of
               water; with it, the eye reads motion even standing still. */
            const fall = ease ? ((T * 0.24 + ph) % 1) : 0.5;
            const near = Math.max(0, 1 - Math.abs((fa + fb) / 2 - fall) * 3.2);
            /* `mix` takes a *fraction* toward warm white (positive) or the void (negative) — not a
               multiplier. Round 58 doubled the curtain out to cream by passing 1.10 here: a
               fraction of 1.1 overshoots white on every channel and clamps, so a "10 % brighter
               rope" became a solid cream wall. These stay inside ±0.25. */
            /* Only two terms, and both change slowly along the rope: the rope's own grade of water,
               and the travelling brightness. Round 58 also added a per-band sine here, which
               alternated sign every band and tiled the curtain into a visible chequerboard of
               rectangles — a water line is continuous, so every term that builds one must be. */
            const tone = (bright ? 0.52 : rope ? 0.06 : -0.24) + 0.16 * near;
            /* One rope in five carries white water: the fall is not a tinted glass sheet, it is a
               curtain with bright ropes in it, and that contrast is what the eye reads as motion
               even in a still frame. */
            /* And the rope leans: a slow sine of its own phase, so a seam leaves the lip in one place
               and reaches the foot in another. A perfectly vertical seam is a barcode. */
            const wA = Math.sin(fa * 5.3 + k * 2.1) * aw * 0.12;
            const wB = Math.sin(fb * 5.3 + k * 2.1) * aw * 0.12;
            /* Round 58: every rope changed tone at the same height, so the gradient's steps lined up
               across the whole crest and drew horizontal rules over the water — the vertical grain
               was finally right and the eye still had forty-four straight lines to read. Each rope
               now carries its own vertical offset, so a step belongs to one rope and dies at its
               seam. */
            const vj = (hash(k * 3.1 + 0.7) - 0.5) * drop * 0.055;
            /* The offset must not lift water above the lip: a rope pushed up by a few centimetres
               stood over the crest line as a green tab floating above the railing. Only inward. */
            const j0 = fa === 0 ? 0 : vj, j1 = vj;
            /* Round 58, sixth pass — 夜間水色 on the water itself.

               The illumination used to be one warm wash laid *over* the installed sheet, and the
               sheet is drawn in the same plane as that wash: the painter sorted the wash behind half
               the ropes and the fall came out blue under a blue sky, with warm patches where the
               sort fell the other way. The light is on the water, so it belongs in the water's own
               colour: every rope is blended toward the lamps' warm white by how dark it is, and the
               seam quads below stay cold, which is what makes lit water read as lit. */
            const colN = nightK > 0.02 ? blendHex(col, "#ffe9c6", 0.62 * nightK) : col;
            const q = add(C, [Pt(a0 + wA, y0 + j0, t0), Pt(a1 + wA, y0 + j0, t3),
                              Pt(a1 + wB, y1 + j1, t2), Pt(a0 + wB, y1 + j1, t1)],
                          ZERO8, "flat", bright ? mix(mix(colN, 0.80), tone) : mix(colN, tone));
            /* Round 58: `lit` is a wash *toward the day's light*, not a brightness multiplier, so
               anything above 1.0 drives the colour to white — which is how a teal curtain became a
               grey wall. The sheet is water, not a lit surface: it sits at the low end. */
            /* Round 58: `air` is the aerial haze, and it is *computed from the quad's distance*
               when it is not given — 55 % of the frame's fog at this range, which is exactly the
               flat wash the owner reported. A falls fifteen metres away is not in the haze; it is
               the haze. Pinned low, with a little left so the far end of the crest still recedes. */
            if (q) {
              q.lit = 0.72 + (fa >= 0.15 ? 0.10 : 0.02); q.air = 0.07;
              /* Lit water is not night colour. The lane's night pass mixes every quad 62 % toward
                 the sky's navy, so blending the lamps in *before* that mix is a wash that gets
                 painted over: the fall came out blue at 3 a.m. with warm patches where the depth
                 sort happened to favour the wash. `nolite` takes the sheet out of the night pass —
                 which is the fact the illumination board records, that the falls is the lit thing
                 in a dark gorge — and `day` false keeps the sun off it. */
              if (nightK > 0.12) { q.nolite = true; q.day = false; q.lit = 1.0; }
              drawn.push(q);
            }
          }
          /* The seam between two ropes: the dark water standing in the gap, which is what gives a
             curtain its vertical grain. One narrow column, painted in front of the columns beside
             it so it always separates them. It widens as it falls — water pulls apart into ropes
             on the way down and a gap at the lip is a crevasse at the foot. */
          const gap = (rope ? 0.15 : 0.09) * (0.62 + 0.74 * hash(k + 41));
          {
            /* One column, lip to foot, tapering open as it falls. Round 58 drew this in three
               chunks of different widths applied abruptly, and three abrupt widths per rope is a
               stack of dark tabs down the face — the same failure as the old four-tone banding,
               rotated ninety degrees. Water lines are continuous. */
            const gA = aw * gap * 0.55, gB = aw * gap * 1.75;
            const lean0 = Math.sin(0 * 5.3 + k * 2.1) * aw * 0.12;
            const lean1 = Math.sin(1 * 5.3 + k * 2.1) * aw * 0.12;
            const q = add(C, [Pt(ac - gA + lean0, crestY, throwAt(0) - 3), Pt(ac + gA + lean0, crestY, throwAt(0) - 3),
                              Pt(ac + gB + lean1, crestY - drop, throwAt(1) - 3),
                              Pt(ac - gB + lean1, crestY - drop, throwAt(1) - 3)],
                          ZERO8, "flat", "rgba(30,76,88," + (0.34 + 0.26 * (1 - hash(k + 7))).toFixed(3) + ")");
            if (q) { q.lit = 0.70; q.air = 0.05; drawn.push(q); }
          }
        }
        /* The mist, in front of the sheet rather than behind it. Round 57's columns of spray stood
           *over* the crest and read as fog on the horizon; what a visitor at the brink sees is mist
           coming back up the face, thinnest at the lip and thickest where the water has just landed.
           Seven soft quads, drifting on the frame clock, each denser at its foot. */
        for (let i = 0; i < 7; i++) {
          const a = -hw * 0.92 + (i / 6) * hw * 1.84;
          const drift = ease ? Math.sin(T * 0.33 + i * 1.7) * 90 : 0;
          const reach2 = 0.42 + 0.16 * Math.sin(i * 2.1);        // how far up the face it climbs
          const yTop = crestY - drop * (1 - reach2), yBot = crestY - drop * 0.99;
          const q = add(C, [Pt(a - 420 + drift, yBot, 46), Pt(a + 420 + drift, yBot, 46),
                            Pt(a + 300 + drift, yTop, 40), Pt(a - 300 + drift, yTop, 40)],
                        ZERO8, "soft", "rgba(244,251,250,0.30)");
          if (q) { q.lit = 1.15; q.day = false; q.air = 0.0; drawn.push(q); }
        }
        /* The foot: the water arriving. Every falls ends in a white line — the plunge, where the
           falling sheet turns into spray instead of water — and that line is the thing that says
           how far the water has come. Two bands, the second thrown forward. */
        Q(-hw, hw, crestY - drop * 0.985, crestY - drop * 0.90, 26, 20, "#f2fbfa", 1.35, 0.0);
        Q(-hw, hw, crestY - drop * 0.93, crestY - drop * 0.80, 34, 24, "rgba(232,248,247,0.62)", 1.1, 0.02);
        /* The billows standing at the foot: the water has landed and is coming back up. Four slabs
           across the crest, drifting on the frame clock, each one highest where the water is. */
        for (let i = 0; i < 9; i++) {
          const a = -hw * 0.9 + (i / 8) * hw * 1.8;
          const rise = 0.10 + 0.07 * Math.sin(i * 1.9);
          const drift = ease ? Math.sin(T * 0.4 + i * 1.3) * 60 : 0;
          const top = crestY - drop * (1 - rise);
          /* Round 58: nine of these at `air` 0.30 stacked into one flat paper lid across the bottom
             of the frame. Smaller, and each one its own soft centre. */
          const q = add(C, [Pt(a - 170 + drift, crestY - drop * 0.995, 40), Pt(a + 170 + drift, crestY - drop * 0.995, 40),
                            Pt(a + 120 + drift, top, 30), Pt(a - 120 + drift, top, 30)],
                        ZERO8, "soft", "#ffffff", PATS.foam);
          if (q) { q.lit = 1.05; q.air = 0.10; drawn.push(q); }
        }
        /* The mist the owner asked for.

           Everything the falls does with mist, it does *in front of the water*: the plunge throws
           spray back up the face, and from the rail that spray is a veil you see the sheet through,
           not a fog on the horizon behind it. Round 57 put its spray columns behind and above the
           crest, where they read as weather. These eleven soft quads stand between the camera and
           the sheet, at the height the water has already fallen to, drifting up on the frame clock
           and thinning as they rise — thin enough that the ropes are still legible through them,
           which is the whole point of a veil. */
        for (let i = 0; i < 11; i++) {
          const a = -hw * 0.95 + (i / 10) * hw * 1.9;
          const rise = 0.30 + 0.26 * hash(i * 7.7 + 3.1);
          const ph = ease ? ((T * 0.13 + hash(i * 3.3)) % 1) : 0.4;
          const lift = drop * rise * (0.25 + 0.75 * ph);
          const yB = crestY - drop * (0.62 + 0.30 * ph);
          const yT = yB + drop * (0.30 + 0.22 * hash(i * 5.1));      // taller as it climbs
          const drift = ease ? Math.sin(T * 0.21 + i * 1.9) * 140 : 0;
          const q = add(C, [Pt(a - 520 + drift, yB, 120), Pt(a + 520 + drift, yB, 120),
                            Pt(a + 380 + drift, yT, 120), Pt(a - 380 + drift, yT, 120)],
                        ZERO8, "soft", `rgba(232,246,246,${(0.055 + 0.055 * (1 - ph)).toFixed(3)})`);
          if (q) { q.lit = 1.2; q.day = false; q.air = 0; drawn.push(q); }
        }
        /* Spray breaking over the lip: the puffs a falls throws *up*, above the crest line, small
           and fast. Six, on the same clock, so the brink is never still. */
        for (let i = 0; i < 6; i++) {
          const a = -hw * 0.9 + (i / 5) * hw * 1.8 + (ease ? Math.sin(T * 0.9 + i) * 90 : 0);
          const up = drop * (0.02 + 0.03 * Math.abs(Math.sin(i * 2.1)));
          const q = add(C, [Pt(a - 230, crestY - up * 0.2, 60), Pt(a + 230, crestY - up * 0.2, 60),
                            Pt(a + 170, crestY + up, 60), Pt(a - 170, crestY + up, 60)],
                        ZERO8, "soft", "rgba(240,252,251,0.10)");
          if (q) { q.lit = 1.3; q.day = false; q.air = 0; drawn.push(q); }
        }
        for (let i = fromHere; i < drawn.length; i++) drawn[i].day = false;
        /* After dark the falls is the brightest thing in the gorge: the illumination board puts
           lamps on the American side and the curtain goes warm white and then, on some nights,
           green. One wash over the sheet, warm and low, is enough — the drawing does not have to
           name the colour the lights were set to. */
        if (nightK > 0.12) {
          for (let i = 0; i < 5; i++) {
            const a0 = -hw + (i / 5) * hw * 2, a1 = -hw + ((i + 1) / 5) * hw * 2;
            const q = add(C, [Pt(a0, crestY - drop * 0.05, 52), Pt(a1, crestY - drop * 0.05, 52),
                              Pt(a1, crestY - drop * 0.92, 44), Pt(a0, crestY - drop * 0.92, 44)],
                          ZERO8, "flat", "rgba(255,236,200," + (0.30 * nightK).toFixed(3) + ")");
            if (q) { q.lit = 1.5; q.day = false; q.nolite = true; q.air = 0; drawn.push(q); }
          }
        }
        /* The headlands: the rock the water goes between, standing the drop's own height on the
           bank so the sheet has an edge to disappear behind at either end. */
        [-1, 1].forEach((sd) => {
          const a = sd * (hw + 90);
          const c0 = Pt(a - 90, crestY + 120, 120), c1 = Pt(a + 90, crestY + 120, 120);
          const c2 = Pt(a + 70, crestY - drop, 260), c3 = Pt(a - 70, crestY - drop, 260);
          const q = add(C, [c0, c1, c2, c3], ZERO8, "flat", sd < 0 ? "#2f3b46" : "#33404a");
          if (q) { q.lit = 0.55; q.air = 0.28; drawn.push(q); }
        });
        /* The spray. It leaves the foot, comes back over the crest and hangs there at eye level,
           drifting with the frame clock — the reason a falls is felt before it is read. Three
           nested slabs per column, wide and faint outside, narrow and denser in: a gradient made of
           quads, because that is what this painter has. */
        for (let i = 0; i < 7; i++) {
          const a = -hw * 0.86 + (i + 0.5) * (hw * 1.72 / 7);
          const drift = ease ? Math.sin(T * 0.5 + i * 1.9) * 20 : 0;
          const rise = 130 + (i % 4) * 55;
          for (let k = 0; k < 3; k++) {
            const w = 120 + k * 95, top = crestY + rise * (1 - k * 0.16);
            /* Soft, not a slab. The lane's painter has one soft-edged quad (`soft`, a radial falloff
               the renderer makes once): spray is the reason it exists, and a hard-edged pale
               rectangle is exactly what mist must not look like up close. */
            const q = add(C, [Pt(a - w + drift, crestY - 30, -40), Pt(a + w + drift, crestY - 30, -40),
                              Pt(a + w * 0.8 + drift, top, -22), Pt(a - w * 0.8 + drift, top, -22)],
                          ZERO8, "flat", "#eef8f8");
            if (q) {
              q.lit = 1.02; q.air = 0.03;
              q.soft = { rgb: "238,248,250", a: 0.16 - k * 0.035 };
              drawn.push(q);
            }
          }
        }
        // The churn over the lip itself: the whole crest disappears into its own spray, which is
        // what the brink actually looks like from three paces back.
        {
          const veil = H(-hw, hw, -300, 20, crestY + 16, "#f2fbfb", 1.05, 0.02);
          if (veil) veil.soft = { rgb: "242,251,251", a: 0.13 };
        }
        // The pool the sheet lands in: a pale churn below the crest, and the rock shelf it lands on.
        H(-hw, hw, 40, 900, crestY - drop, "#dfeceb", 1.05, 0.12);
        H(-hw, hw, 900, 2400, crestY - drop - 1, "#4f8f8b", 0.95, 0.16);
        /* Round 58, sixth pass — the water below the falls after dark.

           The illumination reaches the plunge pool as much as the sheet: the light comes off the
           falling water, and the churn at its foot is the brightest part of the river for a hundred
           metres downstream. This water had no night term at all, so at night the sheet went warm
           white while the pool under it stayed daylight teal — the owner's 夜間水色, still unsolved
           because only half the water was ever told what time it was. Warm wash, low, and the pool
           surfaces lit from the falls' own side. */
        if (nightK > 0.12) {
          const wash = (t0, t1, y, a) => {
            const q = add(C, [Pt(-hw, y, t0), Pt(hw, y, t0), Pt(hw, y, t1), Pt(-hw, y, t1)],
                          ZERO8, "flat", "rgba(255,232,198," + (a * nightK).toFixed(3) + ")");
            if (q) { q.lit = 1.35; q.day = false; q.nolite = true; q.air = 0.02; drawn.push(q); }
          };
          wash(40, 900, crestY - drop + 1, 0.34);      // the churn, nearest the sheet
          wash(900, 2400, crestY - drop, 0.20);        // the pool running away from it
        }
      } else if (shape === "falls") {
        /* The falls at table scale: a pale sheet over a ledge into mist, held between two dark
           headlands. The sheet's stripes shimmer with the frame clock — they move because the
           walker is here, and hold still when the lane rests, which is the house rule for time. */
        const hw = m.w / 2, hd = m.d / 2;
        /* Which way the water faces.

           `facesOf` does not turn a box, it only swaps the box's width and depth -- so a face built
           "at z minus half the depth, spanning x" is always that, whatever `ry` says. Built that way
           the sheet lay in the plane the walker looks *along* from the falls stop: you stood beside
           the waterfall and saw it edge on, a hundred-centimetre cliff with no water on it, and a
           magenta probe put on the sheet to find it painted exactly zero pixels. The tables stand
           off the lane and the lane is where the walker is, so the sheet turns out of its object to
           face across: `P(a, y, t)` is a point on the face at `a` across it and `t` back into it. */
        const along = Math.abs(m.ry) > 45, sgn = m.ry > 0 ? 1 : -1;
        const P = (a, y, t) => along ? [m.x + sgn * (hd - t), y, m.z + a]
                                     : [m.x + a, y, m.z - hd + t];
        // The two headlands the water falls between.
        [[-1], [1]].forEach(([s]) => {
          const off = s * (hw - m.w * 0.11);
          facesOf({ ...m, x: m.x + (along ? 0 : off), z: m.z + (along ? off : 0),
                    w: m.w * 0.22, h: m.h }).forEach((f) => {
            const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                         + f.n[2] * (C.z - f.p[0][2]);
            if (toward <= 0) return;
            const q = PATS.rock ? add(C, f.p, patUV(f), "pat", PATS.rock)
                                : add(C, f.p, ZERO8, "flat", mix("#233150", f.k));
            // A gorge wall is dark and wet. `lit` was the wrong lever -- it only lays a warm wash
            // over an unchanged base -- so the wall is darkened with air, which is the Navy overlay.
            if (q) { q.lit = lit; q.air = 0.34; drawn.push(q); }
          });
        });
        /* Horseshoe.

           These are the Horseshoe Falls and a horseshoe is a curve: the crest bows upstream at the
           centre, so the middle of the sheet stands further from the walker than either end. Built
           as one flat quad from end to end it read as a tall narrow ribbon down a slot gorge, which
           is a different waterfall entirely -- and at 130 x 100 it was that ribbon nine times over,
           when the falls it is named for run 670 m of crest to a 57 m drop. Breadth is what
           identifies this place, so the model is 228 x 52 and the crest is laid as thirteen panels
           whose endpoints follow one continuous bow instead of a row of parallel curtains. */
        const NA = 13;
        // Exaggerated only enough to read at table scale: the centre of the Horseshoe recedes.
        const bow = (a) => hd * 1.75 * Math.max(0, 1 - (a / (hw * 0.82)) ** 2);
        const across = (t, fn) => {
          for (let k = 0; k < NA; k++) {
            const a0 = -hw * 0.76 + (k / NA) * hw * 1.52;
            const a1 = -hw * 0.76 + ((k + 1) / NA) * hw * 1.52;
            fn(a0, a1, bow(a0) + t, bow(a1) + t);
          }
        };
        /* The falls are floodlit after dark — every night, coloured lights played up the sheet.
           The illumination cycles its colours slowly, so at night the jade becomes whichever
           colour the lights hold, brightened the way a lit curtain is. Day keeps the jade. */
        const nightfall = DAYPAGE && DAY() < 0.25;
        const ILLUM = ["#37c46b", "#e0435c", "#3f7de0", "#b04de0", "#e0a13f"];
        const illum = nightfall ? ILLUM[Math.floor(T / 7) % ILLUM.length] : null;
        // The sheet: three height slices, bright at the crest and shadowing toward the basin —
        // one flat lit value was what made it a glowing white board — then moving stripes over it.
        /* Three height slices keep the jade from becoming a single glowing board. The falling
           streaks are an overlay, kept translucent so the base colour stays visible and the curtain
           reads as water rather than a set of white strips. */
        [[0, 0.88, "#286f86"], [1, 1.02, "#3c8da0"], [2, 1.18, "#6bb5bb"]].forEach(([si, l, col]) => {
          if (illum) { col = illum; l = 1.45; }
          const y0 = m.y + (si / 3) * m.h, y1 = m.y + ((si + 1) / 3) * m.h;
          /* A surge: water does not fall evenly, a body of it comes down and passes. The wave runs
             down the three slices, so the brightness travels with it instead of pulsing in place.
             It is the water's colour that surges, not its `lit`, for the reason above: a warm wash
             gated above 0.55 cannot carry a body of moving water. */
          /* 0.2, not 0.16: there is less water now. Broadening the crest and halving its height cut
             the sheet from 9,880 cm2 to 8,996, and the surge is spread over the water there is. */
          const surge = ease ? 0.2 * Math.sin(T * 0.55 - si * 0.8) : 0;
          across(0, (a0, a1, t0, t1) => {
            const sheet = add(C, [P(a0, y0, t0), P(a1, y0, t1),
                                  P(a1, y1, t1), P(a0, y1, t0)],
                              ZERO8, "flat", mix(col, surge));
            if (sheet) { sheet.lit = l; drawn.push(sheet); }
          });
        });
        // Foam at the plunge line: the one place a waterfall is unambiguously white.
        across(-2, (a0, a1, t0, t1) => {
          const foam = add(C, [P(a0, m.y + m.h * 0.06, t0), P(a1, m.y + m.h * 0.06, t1),
                               P(a1, m.y + m.h * 0.2, t1), P(a0, m.y + m.h * 0.2, t0)],
                           ZERO8, "flat", `rgba(246,253,252,${(0.46 + (ease ? 0.12 * Math.sin(T * 2.1) : 0)).toFixed(2)})`);
          if (foam) { foam.lit = 1.7; drawn.push(foam); }
        });
        /* Moving streaks add motion across the broad crest. Sixteen leave enough blue curtain
           between them to read as one body of water; the fine streams below keep it continuous. */
        for (let i = 0; i < 16; i++) {
          const sx = -hw * 0.68 + (i + 0.5) * (hw * 1.36 / 16);
          const fall = ease ? ((T * 0.32 + i / 12) % 1) : 0.45;
          const yTop = m.y + m.h * (1 - fall), yBot = Math.max(m.y, yTop - m.h * 0.32);
          const a = 0.16 + 0.09 * Math.sin(T * 3.1 + i * 2.3);
          const st = add(C, [P(sx - 1.8, yBot, bow(sx) - 2.6), P(sx + 1.8, yBot, bow(sx) - 2.6),
                             P(sx + 1.8, yTop, bow(sx) - 2.6), P(sx - 1.8, yTop, bow(sx) - 2.6)],
                         ZERO8, "flat", `rgba(255,255,255,${a.toFixed(2)})`);
          if (st) { st.lit = 1.2; drawn.push(st); }
        }
        // Continuous, fine white-blue streams keep the curtain visibly falling between the moving surges.
        for (let i = 0; i < 16; i++) {
          const sx = -hw * 0.68 + (i + 0.5) * (hw * 1.36 / 16);
          const width = i % 4 === 0 ? 2.3 : 1.35;
          const drift = ease ? Math.sin(T * 1.7 + i * 1.3) * 1.8 : 0;
          const alpha = i % 4 === 0 ? 0.24 : 0.15;
          const stream = add(C, [P(sx - width, m.y + m.h * 0.08, bow(sx) - 3.5),
                                P(sx + width, m.y + m.h * 0.08, bow(sx) - 3.5),
                                P(sx + width + drift, m.y + m.h * 0.94, bow(sx + drift) - 3.5),
                                P(sx - width + drift, m.y + m.h * 0.94, bow(sx + drift) - 3.5)],
                            ZERO8, "flat", `rgba(235,250,252,${alpha})`);
          if (stream) { stream.lit = 1.1; drawn.push(stream); }
        }
        // Broken spray at the plunge line: small uneven flecks, not a single straight white stripe.
        for (let i = 0; i < 18; i++) {
          const sx = -hw * 0.72 + (i + 0.35) * (hw * 1.44 / 18);
          const size = 1.8 + (i % 4) * 0.65;
          const y = m.y + m.h * (0.075 + (i % 5) * 0.014) + (ease ? Math.sin(T * 1.2 + i) * 0.35 : 0);
          const t = bow(sx) - 15;
          const splash = add(C, [P(sx - size, y, t), P(sx - size * 0.2, y - size * 0.7, t - 0.7),
                                 P(sx + size * 0.55, y - size * 0.15, t - 0.4),
                                 P(sx + size, y + size * 0.28, t), P(sx + size * 0.05, y + size, t + 0.2)],
                            new Array(10).fill(0), "flat", `rgba(244,252,252,${(0.38 + (i % 3) * 0.06).toFixed(2)})`);
          if (splash) { splash.lit = 1.35; drawn.push(splash); }
        }
        // The crest the sheet comes over, and the mist it lands in.
        // The crest is a lip of water, not a strip light: at 1.35x it was the brightest thing on
        // the table and it flattened the sheet behind it into a backdrop.
        across(hd * 0.6, (a0, a1, t0, t1) => {
          const crest = add(C, [P(a0, m.y + m.h, t0), P(a1, m.y + m.h, t1),
                                P(a1, m.y + m.h + 7, t1), P(a0, m.y + m.h + 7, t0)],
                            ZERO8, "flat", "#e4f0ee");
          if (crest) { crest.lit = 1.12; drawn.push(crest); }
        });
        across(-8, (a0, a1, t0, t1) => {
          const mist = add(C, [P(a0, m.y + 2, t0), P(a1, m.y + 2, t1),
                               P(a1, m.y + m.h * 0.3, t1), P(a0, m.y + m.h * 0.3, t0)],
                           ZERO8, "flat", `rgba(214,232,238,${(0.24 + (ease ? 0.08 * Math.sin(T * 1.3) : 0)).toFixed(2)})`);
          if (mist) { mist.lit = 0.8; mist.air = 0.08; drawn.push(mist); }
        });
        const basinFar = hd * 1.8, basinV = (basinFar + 10) * DPM;
        const basin = add(C, [P(-hw, m.y + 1, -10), P(hw, m.y + 1, -10),
                              P(hw, m.y + 1, basinFar), P(-hw, m.y + 1, basinFar)],
                          [0, 0, hw * 2 * DPM, 0, hw * 2 * DPM, basinV, 0, basinV],
                          "pat", PATS.water || "#5f7d99");
        if (basin) { basin.lit = 0.9; drawn.push(basin); }
        // A Maid of the Mist tour boat in the basin: pointed white hull, blue waterline and a small
        // passenger cabin, rather than a white cuboid on the water.
        const bxr = ease ? Math.sin(T * 0.4) * hw * 0.55 : hw * 0.2;
        const bp = P(bxr, m.y + 2, -6), boatP = (u, v, y) =>
          along ? [bp[0] + v, y, bp[2] + u] : [bp[0] + u, y, bp[2] + v];
        const boatPlan = [[-8, 0], [-5, 3.0], [4, 3.0], [8, 0], [4, -3.0], [-5, -3.0]];
        for (let i = 0; i < boatPlan.length; i++) {
          const a = boatPlan[i], b = boatPlan[(i + 1) % boatPlan.length];
          const hull = add(C, [boatP(a[0] * 0.82, a[1] * 0.82, m.y + 2.5),
                               boatP(b[0] * 0.82, b[1] * 0.82, m.y + 2.5),
                               boatP(b[0], b[1], m.y + 4.0), boatP(a[0], a[1], m.y + 4.0)],
                            ZERO8, "flat", i % 2 ? "#31536e" : "#27465f");
          if (hull) { hull.lit = lit * 1.0; drawn.push(hull); }
        }
        const tourDeck = add(C, boatPlan.map(([u, v]) => boatP(u * 0.96, v * 0.96, m.y + 4.0)),
                             new Array(boatPlan.length * 2).fill(0), "flat", "#e7edef");
        if (tourDeck) { tourDeck.lit = 1.08; drawn.push(tourDeck); }
        const tCab = { x: bp[0], z: bp[2], y: m.y + 4, w: 9, h: 3.2, d: 4.5, ry: m.ry };
        facesOf(tCab).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix("#eef2ef", f.k * 0.2));
          if (q) { q.lit = 1.12; drawn.push(q); }
        });
        const windowQ = add(C, [boatP(-2.8, 2.34, m.y + 5.0), boatP(2.8, 2.34, m.y + 5.0),
                                boatP(2.8, 2.34, m.y + 6.6), boatP(-2.8, 2.34, m.y + 6.6)],
                            ZERO8, "flat", "#263f55");
        if (windowQ) { windowQ.lit = lit; drawn.push(windowQ); }
        const tourWake = add(C, [boatP(-8, -1.2, m.y + 2.2), boatP(-8, 1.2, m.y + 2.2),
                                 boatP(-15, 3.2, m.y + 2.2), boatP(-17, -3.2, m.y + 2.2)],
                            ZERO8, "flat", `rgba(230,242,247,${ease ? 0.28 : 0.14})`);
        if (tourWake) { tourWake.lit = 1.08; drawn.push(tourWake); }
        // Rolling fog over the water, the way the spray hangs at the rail.
        const fogx = ease ? Math.sin(T * 0.12) * hw * 0.3 : 0;
        const fog = add(C, [P(-hw + fogx, m.y + m.h * 0.22, -12), P(hw + fogx, m.y + m.h * 0.22, -12),
                            P(hw + fogx, m.y + m.h * 0.48, -12), P(-hw + fogx, m.y + m.h * 0.48, -12)],
                        ZERO8, "flat", `rgba(236,242,248,${(0.11 + (ease ? 0.04 * Math.sin(T * 0.7) : 0)).toFixed(2)})`);
        if (fog) { fog.lit = 1.0; fog.air = 0.1; drawn.push(fog); }
      } else if (shape === "pool") {
        /* Still water on a table: two depth slices — the far water catches the spot, the near
           water stays deep — with a sheen the hall's spots put on it. */
        [[-1, 0.82], [1, 1.0]].forEach(([sz, l]) => {
          const z0 = m.z + (sz < 0 ? -m.d / 2 : 0), z1 = m.z + (sz > 0 ? m.d / 2 : 0);
          const q = add(C, [[m.x - m.w / 2, m.y + 1, z0], [m.x + m.w / 2, m.y + 1, z0],
                            [m.x + m.w / 2, m.y + 1, z1], [m.x - m.w / 2, m.y + 1, z1]],
                        [(m.x - m.w / 2) * DPM, z0 * DPM, (m.x + m.w / 2) * DPM, z0 * DPM,
                         (m.x + m.w / 2) * DPM, z1 * DPM, (m.x - m.w / 2) * DPM, z1 * DPM],
                        "pat", PATS.water || base);
          if (q) { q.lit = l; drawn.push(q); }
        });
        const drift = ease ? Math.sin(T * 0.5) * m.w * 0.22 : 0;
        const sheen = add(C, [[m.x - m.w * 0.2 + drift, m.y + 2, m.z - m.d * 0.3], [m.x + m.w * 0.1 + drift, m.y + 2, m.z - m.d * 0.3],
                              [m.x + m.w * 0.2 + drift, m.y + 2, m.z - m.d * 0.1], [m.x - m.w * 0.1 + drift, m.y + 2, m.z - m.d * 0.1]],
                          ZERO8, "flat", "rgba(214,230,244,0.7)");
        if (sheen) { sheen.lit = 1.1; drawn.push(sheen); }
        // A pressed basin answers: the stone rings expand once and are gone — the pool branch
        // keeps no state of its own, so a demonstration that never ends would be an animation
        // pretending to be a fact. 2.5 s, both banks, the wake's own pale colour.
        {
          const dAt = m.el && m.el.__demoAt;
          if (dAt) {
            const dt = (performance.now() - dAt) / 1000;
            if (dt >= 0 && dt < 2.5) {
              [[0.0, 0.5], [0.9, 0.32]].forEach(([lag, a]) => {
                const k = (dt - lag) / 1.6;
                if (k < 0 || k > 1) return;
                const u = m.w * 0.46 * k;
                [-1, 1].forEach((sd) => {
                  const q = add(C, [[m.x + sd * u - 3, m.y + 2, m.z - m.d * 0.4],
                                   [m.x + sd * u + 3, m.y + 2, m.z - m.d * 0.4],
                                   [m.x + sd * u + 3, m.y + 2, m.z + m.d * 0.4],
                                   [m.x + sd * u - 3, m.y + 2, m.z + m.d * 0.4]],
                                 ZERO8, "flat", `rgba(221,239,246,${(a * (1 - k)).toFixed(3)})`);
                  if (q) { q.lit = 1.2; q.nolite = true; drawn.push(q); }
                });
              });
            }
          }
        }
      } else if (shape === "boat") {
        /* Toronto Islands ferry: a double-ended, waterline hull, open passenger deck, wheelhouse,
           windows, rails and a wake. The timetable eases away from each dock and waits while people
           board; reduced motion moors the model. */
        const along = Math.abs(m.ry) > 45;
        const SAIL = 13, BERTH = 4, REACH = 62;
        const sm = (u) => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
        let run = 10, heading = 0, berthed = true;
        if (ease) {
          const t = T % (2 * (SAIL + BERTH));
          berthed = t >= SAIL && t < SAIL + BERTH || t >= 2 * SAIL + BERTH;
          if (t < SAIL) { run = -REACH + 2 * REACH * sm(t / SAIL); heading = 1; }
          else if (t < SAIL + BERTH) run = REACH;
          else if (t < 2 * SAIL + BERTH) {
            run = REACH - 2 * REACH * sm((t - SAIL - BERTH) / SAIL); heading = -1;
          } else run = -REACH;
        }
        const orient = heading < 0 ? -1 : 1, L = m.w, B = m.d, H = m.h;
        const cx = m.x + (along ? 0 : run), cz = m.z + (along ? run : 0);
        const P = (u, v, y) => along
          ? [cx + v, m.y + y, cz + orient * u]
          : [cx + orient * u, m.y + y, cz + v];
        // Both ends taper so the same hull can make the return crossing without travelling backward.
        const plan = [[-0.50, 0], [-0.31, 0.44], [0.29, 0.44], [0.50, 0], [0.29, -0.44], [-0.31, -0.44]];
        const hullBand = (y0, y1, s0, s1, colour) => {
          for (let i = 0; i < plan.length; i++) {
            const a = plan[i], b = plan[(i + 1) % plan.length];
            const q = add(C, [P(a[0] * L * s0, a[1] * B * s0, y0),
                              P(b[0] * L * s0, b[1] * B * s0, y0),
                              P(b[0] * L * s1, b[1] * B * s1, y1),
                              P(a[0] * L * s1, a[1] * B * s1, y1)],
                          ZERO8, "flat", typeof colour === "function" ? colour(i) : colour);
            if (q) { q.lit = lit * 0.96; drawn.push(q); }
          }
        };
        hullBand(H * 0.035, H * 0.16, 0.80, 0.93, (i) => i % 2 ? "#293e53" : "#344d64");
        hullBand(H * 0.16, H * 0.32, 0.93, 1.00, (i) => i % 3 ? "#e4e8e4" : "#f2f1e9");
        const deck = add(C, plan.map(([u, v]) => P(u * L * 0.98, v * B * 0.98, H * 0.325)),
                         new Array(plan.length * 2).fill(0), "flat", "#c7d0d0");
        if (deck) { deck.lit = lit * 1.02; drawn.push(deck); }

        // A raised wheelhouse sits aft of the open passenger deck; its dark glazing is readable at scale.
        const cabU = -L * 0.055, cabL = L * 0.37, cabB = B * 0.62;
        const cabY = H * 0.325, cabH = H * 0.36;
        const cabX = along ? cx : cx + orient * cabU, cabZ = along ? cz + orient * cabU : cz;
        const cabin = { ...m, x: cabX, z: cabZ, y: m.y + cabY, h: cabH, w: cabL, d: cabB };
        facesOf(cabin).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix("#e7ece8", f.k * 0.38));
          if (q) { q.lit = lit * 1.12; drawn.push(q); }
        });
        const glassY0 = cabY + cabH * 0.38, glassY1 = cabY + cabH * 0.78;
        for (let i = 0; i < 4; i++) {
          const u0 = cabU - cabL * 0.38 + i * cabL * 0.19, u1 = u0 + cabL * 0.13;
          [-1, 1].forEach((side) => {
            const v = side * (cabB * 0.5 + 0.08);
            const q = add(C, [P(u0, v, glassY0), P(u1, v, glassY0), P(u1, v, glassY1), P(u0, v, glassY1)],
                          ZERO8, "flat", "#24394e");
            if (q) { q.lit = lit * 0.86; drawn.push(q); }
          });
        }
        [-1, 1].forEach((end) => {
          const u = cabU + end * (cabL * 0.5 + 0.08);
          const q = add(C, [P(u, -cabB * 0.34, glassY0), P(u, cabB * 0.34, glassY0),
                            P(u, cabB * 0.34, glassY1), P(u, -cabB * 0.34, glassY1)],
                        ZERO8, "flat", "#263b4f");
          if (q) { q.lit = lit * 0.92; drawn.push(q); }
        });
        const roof = facesOf({ ...cabin, y: m.y + cabY + cabH - 1.2, h: 1.6,
                               w: cabL * 1.12, d: cabB * 1.12 });
        roof.forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", "#dce2df");
          if (q) { q.lit = lit * 1.08; drawn.push(q); }
        });
        // A short funnel and mast break the cabin roofline without turning this scale model into a liner.
        const funnelU = cabU - cabL * 0.30;
        const fx = along ? cx : cx + orient * funnelU, fz = along ? cz + orient * funnelU : cz;
        facesOf({ ...m, x: fx, z: fz, y: m.y + cabY + cabH, h: H * 0.18, w: 3.2, d: 3.2 })
          .forEach((f) => {
            const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                         + f.n[2] * (C.z - f.p[0][2]);
            if (toward <= 0) return;
            const q = add(C, f.p, ZERO8, "flat", mix("#536273", f.k));
            if (q) { q.lit = lit; drawn.push(q); }
          });
        [-1, 1].forEach((side) => {
          const railV = side * B * 0.43, u0 = cabU + cabL * 0.56, u1 = L * 0.43;
          const rail = add(C, [P(u0, railV, H * 0.37), P(u1, railV, H * 0.37),
                               P(u1, railV, H * 0.43), P(u0, railV, H * 0.43)],
                           ZERO8, "flat", "#75858b");
          if (rail) { rail.lit = lit * 1.08; drawn.push(rail); }
        });

        // V-shaped pale wakes trail the stern while under way; at the dock only soft ripples remain.
        if (heading) {
          [-1, 1].forEach((side) => {
            const wake = add(C, [P(-L * 0.50, side * B * 0.28, 1.0), P(-L * 0.48, side * B * 0.46, 1.0),
                                 P(-L * 1.22, side * B * 0.78, 1.0), P(-L * 1.34, side * B * 0.55, 1.0)],
                             ZERO8, "flat", "rgba(221,239,246,0.30)");
            if (wake) { wake.lit = 1.15; drawn.push(wake); }
          });
        } else {
          const ripple = add(C, [P(-L * 0.50, -B * 0.40, 1.0), P(-L * 0.30, -B * 0.40, 1.0),
                                 P(-L * 0.30, B * 0.40, 1.0), P(-L * 0.50, B * 0.40, 1.0)],
                             ZERO8, "flat", `rgba(221,239,246,${berthed ? 0.10 : 0.20})`);
          if (ripple) { ripple.lit = 1.05; drawn.push(ripple); }
        }
        if (NIGHT() > 0.15) {
          [-1, 1].forEach((side) => {
            const nav = add(C, [P(cabU, side * (cabB * 0.56), cabY + cabH * 0.82),
                                P(cabU + 1.7, side * (cabB * 0.56), cabY + cabH * 0.82),
                                P(cabU + 1.7, side * (cabB * 0.56), cabY + cabH * 0.92),
                                P(cabU, side * (cabB * 0.56), cabY + cabH * 0.92)],
                            ZERO8, "flat", side < 0 ? "#e64d42" : "#58b985");
            if (nav) { nav.lit = 1.5; nav.nolite = true; drawn.push(nav); }
          });
        }
      } else if (shape === "drawbridge" || shape === "ship") {
        /* Blue Wing Moji, as built (round 32; sources in TODO §0n). 108.1 m end to end, of which two
           leaves move: the 24.1 m parent leaf on the south side, lifted by a wire rope wound over the
           pulley at the head of its pylon (the pylon is pulled landward and the leaf, built in one
           piece with it, rises), and the 14 m child leaf on the north side, pushed up by a hydraulic
           ram. Both rise to about 60 degrees. It opens six times a day -- at 10, 11, 13, 14, 15 and
           16 o'clock -- rising over four or five minutes and down again twenty minutes after it
           began; it is lit after dark but it does not open then. Each leaf hinges at its own bank
           and the tips meet over the channel: the first build hinged both at the middle, so "open"
           was a V with the banks in the air, and it opened only at night, which it never does.
           `leaves` is where the tips meet, as a share of the span from the south end. The pylon's
           height is not in the sources reached; it is drawn at half the parent leaf. */
        const hour = dayPhase() * 24;
        const sm = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
        const OPENS = [10, 11, 13, 14, 15, 16], WIN = 20 / 60, RISE = 4.5 / 60;
        let lift = 0, win = -1, into = 0;
        OPENS.forEach((h0, i) => { const t = hour - h0; if (t >= 0 && t < WIN) { win = i; into = t; } });
        if (win >= 0) lift = into < RISE ? sm(into / RISE) : into > WIN - RISE ? sm((WIN - into) / RISE) : 1;
        // The demonstration (pressed by hand, see act): 24 s of opening on demand, an envelope over
        // whatever the clock is doing. The ship takes the opening too — a demo without a boat is a
        // bridge being rude to it.
        {
          const dAt = m.el && m.el.__demoAt;
          if (dAt) {
            const dt = (performance.now() - dAt) / 1000;
            if (dt >= 0 && dt < 24) {
              const dLift = dt < 6 ? sm(dt / 6) : dt > 18 ? sm((24 - dt) / 6) : 1;
              if (dLift > lift) { lift = dLift; if (win < 0) { win = 0; into = RISE + (dt / 24) * (WIN - 2 * RISE); } }
            }
          }
        }
        const along = Math.abs(m.ry) > 45;
        const PT = (u, y, v) => (along ? [m.x + v, y, m.z + u] : [m.x + u, y, m.z + v]);
        if (shape === "ship") {
          /* A harbour boat on the basin, using the openings the way the boats do: out through the
             mouth on one opening and back in on the next. Between openings it lies where its last
             run left it, and by evening, six runs later, it is home. The big ships are not here:
             they keep to the strait, which the backdrop carries. */
          const half = (m.run || 80) / 2;
          let s;
          if (win >= 0 && into > RISE && into < WIN - RISE) {
            const k = sm((into - RISE) / (WIN - 2 * RISE));
            s = win % 2 === 0 ? -half + 2 * half * k : half - 2 * half * k;
          } else {
            const done = OPENS.filter((h0) => hour >= h0 + WIN - RISE).length;
            s = done % 2 === 1 ? half : -half;
          }
          if (!ease) s = -half;
          const hw = m.w / 2, hd = m.d / 2, h = m.h, y0 = m.y;
          const B = (u, y, v) => PT(u + s, y, v);
          const Qs = (pts, col, l) => {
            const q = add(C, pts, ZERO8, "flat", col);
            if (q) { q.lit = l; drawn.push(q); }
            return q;
          };
          // Hull: a pointed bow, a square stern, white topsides over a dark waterline.
          const hullTop = y0 + h * 0.42;
          [-1, 1].forEach((sd) => Qs([B(-hw, y0, sd * hd), B(hw * 0.62, y0, sd * hd), B(hw * 0.62, hullTop, sd * hd),
                                      B(-hw, hullTop, sd * hd)], "#e9edf0", lit));
          [-1, 1].forEach((sd) => Qs([B(hw * 0.62, y0, sd * hd), B(hw, y0, 0), B(hw, hullTop, 0),
                                      B(hw * 0.62, hullTop, sd * hd)], "#dfe4e8", lit * 0.95));
          Qs([B(-hw, hullTop, -hd), B(hw * 0.62, hullTop, -hd), B(hw, hullTop, 0), B(hw * 0.62, hullTop, hd),
              B(-hw, hullTop, hd)], "#9aa6b0", lit * 0.9);
          Qs([B(-hw, y0, -hd - 0.2), B(hw * 0.62, y0, -hd - 0.2), B(hw * 0.62, y0 + h * 0.1, -hd - 0.2),
              B(-hw, y0 + h * 0.1, -hd - 0.2)], "#24324a", lit * 0.8);
          // The cabin, aft of amidships, with its windows lit after dark.
          const c0 = -hw * 0.7, c1 = hw * 0.25, cT = hullTop + h * 0.4;
          [-1, 1].forEach((sd) => Qs([B(c0, hullTop, sd * hd * 0.8), B(c1, hullTop, sd * hd * 0.8),
                                      B(c1, cT, sd * hd * 0.8), B(c0, cT, sd * hd * 0.8)], "#f2f4f5", lit * 1.05));
          Qs([B(c0, cT, -hd * 0.8), B(c1, cT, -hd * 0.8), B(c1, cT, hd * 0.8), B(c0, cT, hd * 0.8)], "#c8d0d6", lit);
          const nw = NIGHT();
          [-1, 1].forEach((sd) => {
            const q = add(C, [B(c0 + 2, hullTop + h * 0.16, sd * (hd * 0.8 + 0.3)), B(c1 - 2, hullTop + h * 0.16, sd * (hd * 0.8 + 0.3)),
                              B(c1 - 2, hullTop + h * 0.3, sd * (hd * 0.8 + 0.3)), B(c0 + 2, hullTop + h * 0.3, sd * (hd * 0.8 + 0.3))],
                          ZERO8, "flat", nw > 0.3 ? `rgba(255,222,170,${(0.4 + 0.5 * nw).toFixed(3)})` : "#3d4e63");
            if (q) { q.lit = nw > 0.3 ? 1.5 : lit; if (nw > 0.3) q.nolite = true; drawn.push(q); }
          });
        } else {
          const L = m.w, hw = m.d / 2, deck = m.y + m.h;
          const uM = -L / 2 + (m.leaves || 0.47) * L;
          const L1 = (24.1 / 108.1) * L, L2 = (14 / 108.1) * L;
          const uH1 = uM - L1, uH2 = uM + L2;
          const ang = lift * (Math.PI / 3);
          const blue = "#2f6db3", side = mix("#2f6db3", -0.32);
          const Qd = (pts, col, l) => {
            const q = add(C, pts, ZERO8, "flat", col);
            if (q) { q.lit = l; drawn.push(q); }
            return q;
          };
          // A deck between two points in (u, y): its walking face, its two sides and a rail line.
          const deckRun = (u0, y0, u1, y1) => {
            Qd([PT(u0, y0, -hw), PT(u1, y1, -hw), PT(u1, y1, hw), PT(u0, y0, hw)], blue, lit * 1.05);
            [-1, 1].forEach((e) => {
              Qd([PT(u0, y0 - 2.2, e * hw), PT(u1, y1 - 2.2, e * hw), PT(u1, y1, e * hw), PT(u0, y0, e * hw)],
                 side, lit * 0.85);
              Qd([PT(u0, y0, e * hw), PT(u1, y1, e * hw), PT(u1, y1 + 1.6, e * hw), PT(u0, y0 + 1.6, e * hw)],
                 "#dfe8f2", lit * 0.9);
            });
          };
          // The fixed approaches, on their piers.
          deckRun(-L / 2, deck, uH1, deck);
          deckRun(uH2, deck, L / 2, deck);
          [-L / 2 + 6, uH1 - 3, uH2 + 3, L / 2 - 6].forEach((u) => {
            const f = { ...m, x: PT(u, 0, 0)[0], z: PT(u, 0, 0)[2], y: m.y - 8, h: m.h + 6, w: 5, d: m.d * 0.9 };
            facesOf(f).forEach((fc) => {
              const q = add(C, fc.p, ZERO8, "flat", mix("#5d6672", fc.k - 0.1));
              if (q) { q.lit = lit * 0.8; drawn.push(q); }
            });
          });
          // The two leaves, each turning about its own bank.
          deckRun(uH1, deck, uH1 + Math.cos(ang) * L1, deck + Math.sin(ang) * L1);
          deckRun(uH2 - Math.cos(ang) * L2, deck + Math.sin(ang) * L2, uH2, deck);
          // The parent leaf's pylon: built with the leaf, so it leans landward as the leaf rises.
          const pyH = L1 * 0.5;
          const topU = uH1 - Math.sin(ang) * pyH, topY = deck + Math.cos(ang) * pyH;
          [-1, 1].forEach((e) => Qd([PT(uH1 - 1.4, deck, e * hw), PT(uH1 + 1.4, deck, e * hw),
                                     PT(topU + 1.4, topY, e * hw), PT(topU - 1.4, topY, e * hw)], side, lit * 0.95));
          Qd([PT(topU - 2, topY, -hw), PT(topU + 2, topY, -hw), PT(topU + 2, topY, hw), PT(topU - 2, topY, hw)],
             blue, lit);
          // Lit after dark: a line of light along each edge of the walk.
          if (NIGHT() > 0.15) {
            const k = (0.34 * NIGHT()).toFixed(3);
            [[-L / 2, deck, uH1, deck], [uH2, deck, L / 2, deck],
             [uH1, deck, uH1 + Math.cos(ang) * L1, deck + Math.sin(ang) * L1],
             [uH2 - Math.cos(ang) * L2, deck + Math.sin(ang) * L2, uH2, deck]].forEach(([u0, y0, u1, y1]) => {
              const q = add(C, [PT(u0, y0 + 0.4, -hw + 0.6), PT(u1, y1 + 0.4, -hw + 0.6),
                                PT(u1, y1 + 0.4, hw - 0.6), PT(u0, y0 + 0.4, hw - 0.6)],
                            ZERO8, "flat", `rgba(150,206,255,${k})`);
              if (q) { q.lit = 1.5 + 0.5 * lift; q.nolite = true; drawn.push(q); }
            });
          }
        }
      } else if (shape === "wheel") {
        /* Niagara SkyWheel (round 52; the Clifton Hill tech sheet and Wikipedia): a Bussink R60
           giant wheel — 53.3 m at the crown, a 50.5 m rim on a 27.5 m axle, 42 fully enclosed
           Swiss gondolas hung from 21 spoke stations, driven either way at up to 1.5 rpm, open all
           year, a ride of three slow turns in twelve to fifteen minutes. The model keeps the REAL
           rate — forty seconds a revolution — because a park that visibly hurries is a lie about
           the place; the wheel drifts, and that is what the place is. Pressed at the platform,
           the rim lamps take their fast cycle for four seconds and the record says the ride itself
           is not for sale here. */
        const R = (m.dia || 5050) / 2;
        const hubY = m.y + (m.axle || R * 1.089);
        const th0 = ((T / (m.turn || 40)) * Math.PI * 2) + (m.phase0 || 0);
        const WHEELC = ["#37c46b", "#e0435c", "#3f6ea8", "#b04de0", "#e0a13f"];
        const dAt = m.el && m.el.__demoAt ? Math.max(0, (performance.now() - m.el.__demoAt) / 1000) : -1;
        const beat = Math.floor(T / (dAt >= 0 && dAt < 4.2 ? 1.4 : 7)) % WHEELC.length;
        const night = NIGHT();
        const steel = blendHex("#75858b", "#22303f", night * 0.45);
        /* Round 62: the wheel is a thing, not a drawing of one.

           Every quad in this branch used to lie in the plane z = m.z — a 50 m rim drawn as a
           flat disc with 42 flat white squares hung on it. Standing on Clifton Hill, where the
           plaza puts you *beside* the ride rather than in front of it, that plane is edge-on and
           the district's one landmark came out as a handful of hairlines against the sky. The
           rim has depth now (a band on each side of the plane and a tread between them), the
           gondolas are boxes with a side face and a hanger, and the spokes carry a thickness, so
           the same wheel reads from the strip, from the plaza and from under it. */
        const DEPTH = 85;                                   // half the rim's depth, in cm
        const hubW = 230;                                   // the hub's own radius
        const gondola = 168;                                // a CWA cabin's width, and its height
        const pt = (i, r, zOff, dy) => {
          const a = th0 + (i / 42) * Math.PI * 2;
          return [m.x + Math.sin(a) * r, hubY + Math.cos(a) * r + (dy || 0), m.z + (zOff || 0)];
        };
        const Q = (pts, col, l) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; drawn.push(q); return q; }
          return null;
        };
        // the A-frames, one pair to each side of the rim, splayed to the sourced 25 × 20.5 m base
        [-1, 1].forEach((sideX) => {
          [-1, 1].forEach((sideZ) => {
            Q([[m.x + sideX * 1225 - 45, 20, m.z + sideZ * 1025 - 45],
               [m.x + sideX * 1225 + 45, 20, m.z + sideZ * 1025 + 45],
               [m.x + sideX * 90 + 45, hubY - 40, m.z + sideZ * 70],
               [m.x + sideX * 90 - 45, hubY - 40, m.z + sideZ * 70 - 45]], steel, lit);
          });
        });
        /* The rim: 42 stations, each a band across the tyre on both faces of the plane plus the
           tread that joins them. `rimIn` is where the tyre's inner edge is, so the ring reads as
           a ring and not as a hoop of wire. */
        const rimIn = 0.935;
        for (let i = 0; i < 42; i++) {
          [-DEPTH, DEPTH].forEach((zf) => {
            Q([pt(i, R * rimIn, zf), pt(i + 1, R * rimIn, zf),
               pt(i + 1, R, zf), pt(i, R, zf)], steel, lit * 0.95);
          });
          Q([pt(i, R, -DEPTH), pt(i + 1, R, -DEPTH), pt(i + 1, R, DEPTH), pt(i, R, DEPTH)],
            blendHex(steel, "#e6ecef", 0.18), lit);
          Q([pt(i, R * rimIn, -DEPTH), pt(i, R * rimIn, DEPTH),
             pt(i + 1, R * rimIn, DEPTH), pt(i + 1, R * rimIn, -DEPTH)], steel, lit * 0.8);
          if (night > 0.15) {
            const a1 = pt(i + 1, R, -DEPTH);
            const lp = Q([[a1[0] - 55, a1[1] - 55, a1[2] - 55], [a1[0] + 55, a1[1] - 55, a1[2] - 55],
                          [a1[0] + 55, a1[1] + 55, a1[2] + 55], [a1[0] - 55, a1[1] + 55, a1[2] + 55]],
                         WHEELC[(i + beat) % WHEELC.length], 1.5);
            if (lp) lp.nolite = true;
          }
        }
        // the hub, both faces, and the 21 spokes that carry the rim
        [-DEPTH - 40, DEPTH + 40].forEach((zf) => {
          const f = m.z + zf, k = hubW;
          Q([[m.x - k, hubY - k, f], [m.x + k, hubY - k, f], [m.x + k, hubY + k, f], [m.x - k, hubY + k, f]],
            "#536273", lit);
        });
        for (let i = 0; i < 42; i += 2) {
          const p = pt(i, R * rimIn, -26);
          const sp = Q([[p[0] - 30, p[1] - 30, p[2]], [p[0] + 30, p[1] - 30, p[2]],
                        [m.x + 30, hubY + 30, p[2]], [m.x - 30, hubY + 30, p[2]]], steel, lit * 0.9);
          if (sp) {
            // the same spoke's other edge, 52 cm behind: a bar has two sides, not one
            Q([[p[0] - 30, p[1] - 30, p[2] + 52], [m.x - 30, hubY + 30, p[2] + 52],
               [m.x + 30, hubY + 30, p[2] + 52], [p[0] + 30, p[1] - 30, p[2] + 52]], steel, lit * 0.82);
          }
        }
        /* The cabins. An enclosed CWA gondola does not ride its circle's angle — it hangs, level,
           from a hanger on the rim — so the box below each station is drawn upright whatever the
           wheel's phase, with the three faces a visitor can see from the plaza and a warm pane
           when the lights are on. */
        /* Round 65: the cabin is a shape, not a crate.

           The gondola used to be a box with four flat faces: from the plaza, where the wheel's
           foot is fifteen metres away, the cabins read as squares on a string. A CWA gondola is a
           rounded capsule -- eight sides, narrower at the roof, a band of glass round the middle
           and a door on the boarding side -- and that is what this is now: an octagonal plan
           (so the silhouette has corners cut, not corners), a taper towards the roof, a glazing
           band with a mullion between each pane, and a door with a handle on the side the
           platform is on. */
        for (let i = 0; i < 42; i++) {
          const p = pt(i, R, 0);
          const gx = p[0], gy = p[1] - gondola, gz = m.z;
          const hw = gondola / 2;
          const oct = [];
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
            oct.push([Math.cos(a) * hw, Math.sin(a) * hw]);
          }
          const face = (k, y0, y1, shrink) => {
            const a0 = oct[k], a1 = oct[(k + 1) % 8];
            const s = shrink === undefined ? 1 : shrink;
            const b0 = [gx + a0[0] * s, y0, gz + a0[1] * s];
            const b1 = [gx + a1[0] * s, y0, gz + a1[1] * s];
            const b2 = [gx + a1[0] * s, y1, gz + a1[1] * s];
            const b3 = [gx + a0[0] * s, y1, gz + a0[1] * s];
            return [b0, b1, b2, b3];
          };
          for (let k = 0; k < 8; k++) {
            const wall = face(k, gy, gy + gondola, 1);
            const roof = face(k, gy + gondola, gy + gondola, 0.8);
            const fx = (wall[0][0] + wall[1][0]) / 2, fz = (wall[0][2] + wall[1][2]) / 2;
            const mx = (oct[k][0] + oct[(k + 1) % 8][0]) / 2, mz2 = (oct[k][1] + oct[(k + 1) % 8][1]) / 2;
            const nl = Math.hypot(mx, mz2) || 1;
            if ((C.x - fx) * (mx / nl) + (C.z - fz) * (mz2 / nl) <= 0) continue;
            // the wall, tapering in towards the roof
            Q([[wall[0][0], wall[0][1], wall[0][2]], [wall[1][0], wall[1][1], wall[1][2]],
               [roof[1][0], roof[1][1], roof[1][2]], [roof[0][0], roof[0][1], roof[0][2]]],
              "#c3ccd2", lit * 1.02);
            // the glass: a band round the middle of the cabin, divided into panes
            const band = (y0, y1, shrink, col, l) => {
              const a0 = oct[k], a1 = oct[(k + 1) % 8];
              const s = shrink;
              const inset = (p0, p1, y) => {
                const cx = (p0[0] + p1[0]) / 2, cz = (p0[2] + p1[2]) / 2;
                return [gx + (p0[0] - cx) * s, y, gz + (p0[2] - cz) * s];
              };
              const q = [inset(a0, a1, y0), inset(a1, a0, y0), inset(a1, a0, y1), inset(a0, a1, y1)];
              const out = Q(q, col, l);
              if (out && night > 0.15) out.nolite = true;
              return out;
            };
            const glass = night > 0.15 ? "rgba(255,217,160,0.86)" : "#42525f";
            band(gy + gondola * 0.3, gy + gondola * 0.74, 1.03, glass, night > 0.15 ? 1.35 : lit * 0.9);
            // the mullion between the panes
            const mxq = (wall[0][0] + wall[1][0]) / 2, mzq = (wall[0][2] + wall[1][2]) / 2;
            Q([[gx + (wall[0][0] - mxq) * 1.02, gy + gondola * 0.3, gz + (wall[0][2] - mzq) * 1.02],
               [gx + (wall[1][0] - mxq) * 1.02, gy + gondola * 0.3, gz + (wall[1][2] - mzq) * 1.02],
               [gx + (wall[1][0] - mxq) * 1.02, gy + gondola * 0.74, gz + (wall[1][2] - mzq) * 1.02],
               [gx + (wall[0][0] - mxq) * 1.02, gy + gondola * 0.74, gz + (wall[0][2] - mzq) * 1.02]],
              "#9aa6ad", lit * 0.95);
            // the door: on the side the platform is on, with a handle
            if (mz2 < -hw * 0.5) {
              Q([[wall[0][0] + (gx - wall[0][0]) * -0.03, gy + gondola * 0.06, wall[0][2]],
                 [wall[1][0] + (gx - wall[1][0]) * -0.03, gy + gondola * 0.06, wall[1][2]],
                 [wall[1][0] + (gx - wall[1][0]) * -0.03, gy + gondola * 0.94, wall[1][2]],
                 [wall[0][0] + (gx - wall[0][0]) * -0.03, gy + gondola * 0.94, wall[0][2]]],
                "#aeb9bf", lit * 0.98);
              const hx = gx + (wall[0][0] + wall[1][0]) / 4 - gx, hz = gz + (wall[0][2] + wall[1][2]) / 4 - gz;
              Q([[gx + hx - 6, gy + gondola * 0.44, gz + hz - 6], [gx + hx + 6, gy + gondola * 0.44, gz + hz - 6],
                 [gx + hx + 6, gy + gondola * 0.52, gz + hz - 6], [gx + hx - 6, gy + gondola * 0.52, gz + hz - 6]],
                "#6e7a82", lit);
            }
          }
          // the roof cap: the cabin's own lid, a shade lighter than its walls. It is a square
          // plate inscribed in the octagon's plan -- the renderer draws quads, and a lid is a lid.
          const cw = hw * 0.8 * 0.7071;
          Q([[gx - cw, gy + gondola, gz - cw], [gx + cw, gy + gondola, gz - cw],
             [gx + cw, gy + gondola, gz + cw], [gx - cw, gy + gondola, gz + cw]], "#d7dee2", lit * 1.04);
          // the hanger: a short bar from the rim down to the roof of the cabin
          Q([[gx - 22, gy + gondola, gz - 22], [gx + 22, gy + gondola, gz - 22],
             [gx + 22, p[1] + 30, gz - 22], [gx - 22, p[1] + 30, gz - 22]], steel, lit);
        }
        // the base shed the drives live in, on the plaza side
        Q([[m.x - 700, 0, m.z - 1650], [m.x + 700, 0, m.z - 1650],
           [m.x + 700, 380, m.z - 1650], [m.x - 700, 380, m.z - 1650]], "#33414e", lit * 0.9);
      } else if (shape === "carousel") {
        /* A merry-go-round, drawn as the thing itself: a round deck, a mast, a striped canopy that
           turns, and a ring of horses going up and down as it turns. Clifton Hill's strip has had a
           carousel on it since the fun row was built, and a district with one ride in it is a
           funfair ticket booth, not a district. The record authors the diameter, the canopy's
           height and the turn in seconds; nothing here is named after a business.

           Everything is drawn in the plane of the street (`ry` faces the lane), so the ring reads
           as an ellipse on the ground with the canopy over it — the same trick the wheel uses. */
        const R = (m.dia || 900) / 2;                     // cm to the deck's edge
        const canopyY = m.y + (m.h || 420) - 40;          // the canopy's rim
        const mastY = m.y + (m.h || 420) + 120;
        const th = ((T / (m.turn || 26)) * Math.PI * 2) + (m.phase0 || 0);
        const night = NIGHT();
        const STRIPES = ["#c8463f", "#f0e6d2"];
        /* A point on the ring, in the ground plane, at angle `a` and radius `r`.

           Round 58, third pass: this squashed one axis by 0.42 — an *oval deck*, because I mistook
           the ellipse perspective draws for something the geometry had to draw. A carousel's deck is
           a circle on the ground; the camera is what makes it an ellipse. */
        const P = (a, r, y) => [m.x + Math.cos(a) * r, y, m.z + Math.sin(a) * r];
        // the deck: 24 sectors, so the ring is round rather than a square with corners cut off
        for (let i = 0; i < 24; i++) {
          const a0 = th * 0.35 + (i / 24) * Math.PI * 2, a1 = th * 0.35 + ((i + 1) / 24) * Math.PI * 2;
          const q = add(C, [P(a0, R, m.y + 14), P(a1, R, m.y + 14),
                            P(a1, R * 0.18, m.y + 18), P(a0, R * 0.18, m.y + 18)],
                        ZERO8, "flat", i % 2 ? "#7d6a55" : "#8a7660");
          if (q) { q.lit = lit * 0.92; drawn.push(q); }
        }
        // the canopy: alternating stripes, its rim lower than its crown, turning with the deck
        for (let i = 0; i < 16; i++) {
          const a0 = th + (i / 16) * Math.PI * 2, a1 = th + ((i + 1) / 16) * Math.PI * 2;
          const q = add(C, [P(a0, R * 1.02, canopyY), P(a1, R * 1.02, canopyY),
                            P(a1, R * 0.10, canopyY + 120), P(a0, R * 0.10, canopyY + 120)],
                        ZERO8, "flat", STRIPES[i % 2]);
          if (q) { q.lit = lit * 1.05; drawn.push(q); }
        }
        // the scalloped valance, the one part of a carousel everybody remembers
        for (let i = 0; i < 32; i++) {
          const a0 = th + (i / 32) * Math.PI * 2, a1 = th + ((i + 1) / 32) * Math.PI * 2;
          const q = add(C, [P(a0, R * 1.02, canopyY - 26), P(a1, R * 1.02, canopyY - 26),
                            P(a1, R * 1.02, canopyY), P(a0, R * 1.02, canopyY)],
                        ZERO8, "flat", i % 2 ? "#e8d9b4" : "#b8403c");
          if (q) { q.lit = lit * 1.02; drawn.push(q); }
        }
        // the mast, and the finial over it
        const mast = add(C, [[m.x - 16, m.y, m.z - 16], [m.x + 16, m.y, m.z - 16],
                             [m.x + 16, mastY, m.z - 16], [m.x - 16, mastY, m.z - 16]],
                        ZERO8, "flat", "#9a8f7c");
        if (mast) { mast.lit = lit; drawn.push(mast); }
        // twelve horses, each on its own brass pole, rising and falling as the ride turns
        for (let i = 0; i < 12; i++) {
          const a = th + (i / 12) * Math.PI * 2;
          const bob = Math.sin(th * 2 + i * 1.3) * 26;
          const p = P(a, R * 0.72, 0);
          const pole = add(C, [[p[0] - 5, m.y + 18, p[2] - 5], [p[0] + 5, m.y + 18, p[2] - 5],
                               [p[0] + 5, canopyY, p[2] - 5], [p[0] - 5, canopyY, p[2] - 5]],
                          ZERO8, "flat", "#c9a94e");
          if (pole) { pole.lit = lit * 1.1; drawn.push(pole); }
          const h = add(C, [[p[0] - 34, m.y + 74 + bob, p[2] - 12], [p[0] + 34, m.y + 74 + bob, p[2] - 12],
                            [p[0] + 30, m.y + 148 + bob, p[2] - 12], [p[0] - 30, m.y + 148 + bob, p[2] - 12]],
                        ZERO8, "flat", i % 2 ? "#efe6d0" : "#c9b48c");
          if (h) { h.lit = lit * 1.04; drawn.push(h); }
        }
        // after dark the canopy's rim runs a ring of bulbs; the ride is the strip's light source
        if (night > 0.15) {
          for (let i = 0; i < 24; i++) {
            const a = th + (i / 24) * Math.PI * 2;
            const p = P(a, R * 1.02, canopyY + 6);
            const b = add(C, [[p[0] - 22, p[1] - 22, p[2] - 22], [p[0] + 22, p[1] - 22, p[2] - 22],
                              [p[0] + 22, p[1] + 22, p[2] + 22], [p[0] - 22, p[1] + 22, p[2] + 22]],
                          ZERO8, "flat", i % 3 ? "#ffe6b0" : "#ffd07a");
            if (b) { b.lit = 1.5; b.nolite = true; drawn.push(b); }
          }
        }
      } else if (shape === "incline") {
        /* The Falls Incline Railway (round 52; Wikipedia and the Parks' own page): the only one of
           the eight inclines the two cities ever ran that still runs — 59.8 m of double track at
           30 degrees under the bluff, two 40-passenger cars counterbalanced over the head pulley,
           each going up as its twin goes down, 62 seconds a crossing, electric, and since 2013
           enclosed. Opened 8 October 1966 by Von Roll. The cars here run the real clock forever,
           so one is always meeting you; the car YOU board compresses the crossing to the walk
           model's three seconds — which the record line says out loud, both numbers. */
        const L = m.run || 5980, CA = Math.cos(30 * Math.PI / 180), SA = 0.5;
        const per = m.period || 62;
        const night = NIGHT();
        const sNear = (((T / per) + (m.phase0 || 0)) % 1);
        const deckY = m.deck || 2990;
        /* A car on its slope: the body is drawn in the fall line's own basis — x grows with cos30
           and y with sin30, so the floor follows the grade and the box stands 340 cm above it, the
           way the enclosed cars do. The windows are the strip facing the lane; at night the car
           carries its own lit saloon the way the street's boxes do. */
        const carAt = (k, track) => {
          const hw = (m.d || 260) / 2, len = (m.w || 700) / 2, hh = m.h || 340;
          const px = (u) => m.x + (L * CA) * k + CA * u;
          const py = (u, v) => m.y + deckY * k + SA * u + v;
          const c = [[px(-len), py(-len, 40), m.z + track - hw], [px(len), py(len, 40), m.z + track - hw],
                     [px(len), py(len, 40 + hh), m.z + track - hw], [px(-len), py(-len, 40 + hh), m.z + track - hw]];
          const body = add(C, c, ZERO8, "flat", "#dce2df");
          if (body) { body.lit = lit * 1.04; drawn.push(body); }
          const roof = add(C, [c[3], c[2], [px(len), py(len, 40 + hh), m.z + track + hw],
                               [px(-len), py(-len, 40 + hh), m.z + track + hw]], ZERO8, "flat", "#33414e");
          if (roof) { roof.lit = lit; drawn.push(roof); }
          const win = add(C, [[px(-len * 0.72), py(-len * 0.72, 40 + hh * 0.32), m.z + track - hw - 4],
                               [px(len * 0.72), py(len * 0.72, 40 + hh * 0.32), m.z + track - hw - 4],
                               [px(len * 0.72), py(len * 0.72, 40 + hh * 0.72), m.z + track - hw - 4],
                               [px(-len * 0.72), py(-len * 0.72, 40 + hh * 0.72), m.z + track - hw - 4]],
                          ZERO8, "flat", night > 0.15 ? "#ffd9a0" : "#263b4f");
          if (win) { win.lit = night > 0.15 ? 1.5 : lit; if (night > 0.15) win.nolite = true; drawn.push(win); }
        };
        // the two running rails of the double track, and each car's cable beyond it
        [-925, 925].forEach((track) => {
          const rail = add(C, [[m.x - 30, m.y + 20, m.z + track - 26], [m.x + L * CA + 30, m.y + deckY + 20, m.z + track - 26],
                               [m.x + L * CA + 30, m.y + deckY + 20, m.z + track + 26], [m.x - 30, m.y + 20, m.z + track + 26]],
                           ZERO8, "flat", "#5c6a80");
          if (rail) { rail.lit = lit * 0.85; drawn.push(rail); }
        });
        carAt(sNear, -925);
        carAt(1 - sNear, 925);
        /* The head-pulley shed on the bluff, and its pair under the head house.

           Round 58: each was ONE quad, painted on a single plane — and a single plane seen from the
           side is the floating grey parallelogram the owner kept finding over the grass at Niagara's
           fifth station. A shed is a volume: four walls and a lid, each face its own tint, so it
           reads as a building from wherever the visitor stands. */
        /* Round 59: `z = m.z - 1750` put both sheds 17.5 m *up the promenade* from the incline they
           belong to, which is the middle of the walk at the parapet station — the blank grey slab
           that filled the right half of the frame from the second stop is this building, not a wall.
           A shed stands on its own track: the near one, `m.z - 925`, the line the cars run on. */
        const shedAt = (x0, x1, y0, y1, base, z) => {
          const face = (pts, tint) => {
            const q = add(C, pts, ZERO8, "flat", mix(base, tint));
            if (q) { q.lit = lit * 0.9; drawn.push(q); }
          };
          face([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], -0.06);          // the lane side
          face([[x0, y0, z - 160], [x0, y0, z], [x0, y1, z], [x0, y1, z - 160]], -0.16); // west wall
          face([[x1, y0, z], [x1, y0, z - 160], [x1, y1, z - 160], [x1, y1, z]], -0.16); // east wall
          face([[x0, y1, z - 160], [x1, y1, z - 160], [x1, y1, z], [x0, y1, z]], 0.10);  // the lid
        };
        const TRACK_Z = m.z - 925;                 // the near track, where the cars are
        /* The lower station house stands against the west edge of the promenade, the way a station
           stands beside the walk it serves — not across the middle of it. At x −206…−6 it filled a
           third of the walk at the parapet station with a blank grey volume; at the edge it is the
           building the visitor passes on the way to the car. */
        /* The lower station house stands at the foot of the track — where the cars come down and
           where the passenger boards — and the track's foot is the incline's own x, not a metre of
           promenade chosen by hand. Round 59 had it 17.5 m up the walk, and then, on the first
           correction, straddling the rail station itself: a blank 300 cm box 2 m from the visitor's
           eye. */
        shedAt(m.x - 140, m.x + 60, m.y, m.y + 300, "#4b5568", TRACK_Z);
        shedAt(m.x + L * CA - 160, m.x + L * CA + 160, m.y + deckY, m.y + deckY + 420,
               "#4b5568", TRACK_Z);
      } else if (shape === "massing") {
        /* The port table's footprints (round 36/39). The historic buildings and the Retro High Mart
           have their own stands now; the table keeps all five mapped outlines the way a site plan does
           -- low pale plates in OpenStreetMap's geometry, so nothing here competes with the models
           down the hall or claims more than those outlines. Points arrive in table centimetres; the
           kit runs at k = 1, unturned. */
        const K = modelKit(C, { ...m, ry: 0 }, drawn, lit, m.w);
        (m.blocks || []).forEach((b) => {
          const poly = b.p.map(([x, z]) => [x - m.x, m.z - z]);
          K.walls(poly, 0, b.h, base, 1e6);
          K.lid(poly, b.h, "#ecebe4");
        });
      } else if (shape === "stationfront") {
        /*
           Moji Port Station, 1914, on its own stand at 1:25 (round 36).

           The Agency for Cultural Affairs' record is the plan: a timber building rendered to look like
           stone, 812.86 m2 on the ground, its centre two storeys "imagining the character 門" with a
           single storey to either side, symmetric; copper roofs above, slate below (Wikipedia). The
           photographs of the 2012-19 restoration give the rest, and this is built from them: a cream
           front with brick-red string courses, flat pilasters paler than the wall, tall sash windows in
           brown frames, three wide doors under the centre, a pediment with the clock above it, a slate
           mansard with an iron cresting, and the two corner pavilions -- the gate's two posts -- rising
           to copper friezes with round dormers, slate caps and finials. The restoration took off the
           front canopy the 1914 building never had, so there is none here.

           Sizes: the parts' widths are read off the photographs and held to the official area (a 26 x
           15 m centre and two 17 x 11 m wings, 764 m2 against 812.86); heights are the storeys read
           against those widths. Approximate, and the hint says so.
        */
        const K = modelKit(C, m, drawn, lit, 60);
        const CREAM = "#c4b68e", PIL = "#d6cba8", BAND = "#8f5038", BASE = "#a09374", SLATE = "#4f5866",
              COPPER = "#76a389", FRAME = "#7d4f39", SASH = "#ddd4bd", DARK = "#2b2e35";
        // The single-storey wings, either side of the centre, their inner ends against it.
        for (const s of [-1, 1]) {
          const u0 = s < 0 ? -30 : 13, u1 = s < 0 ? -13 : 30;
          K.walls([[u0, -5], [u1, -5], [u1, 6], [u0, 6]], 0, 5.2, CREAM, 2.9, (f) => {
            K.band(f, 0, 0.7, BASE);
            K.band(f, 4.75, 5.2, BAND);
            const n = Math.max(1, Math.round(f.len / 2.9));
            for (let i = 0; i < n; i++) {
              K.win(f, (f.len * (i + 0.5)) / n, 1.3, 1.1, 2.75, { frame: FRAME, fw: 0.15, bars: SASH, rows: [0.66] });
            }
          }, [s < 0 ? 1 : 3]);
          K.roof(u0 - 0.3, u1 + (s < 0 ? 0 : 0.3), -5.3, 6.3, 5.2, 3.4, SLATE,
                 s < 0 ? { right: "wall" } : { left: "wall" });
          // Round-headed dormers along the front slope, as the photographs show them.
          for (let i = 0; i < 3; i++) {
            K.dormer(u0 + ((u1 - u0) * (i + 0.5)) / 3, 3.9, 1.1, 0.9, 6.3, 5.2, 0.5, 8.6, PIL, SLATE,
                     { round: true, frame: SASH, rise: 0.55 });
          }
        }
        // The centre: two storeys, its corner pavilions standing 0.6 m proud of the front.
        const body = [[-13, -7.5], [13, -7.5], [13, 8.1], [8, 8.1], [8, 7.5], [-8, 7.5], [-8, 8.1], [-13, 8.1]];
        K.walls(body, 0, 10.5, CREAM, 2.4, (f) => {
          K.band(f, 0, 0.7, BASE);
          K.band(f, 4.9, 5.3, BAND);                         // the string course between the storeys
          K.band(f, 9.8, 10.5, BAND);                        // the cornice
          const front = f.on[1] > 0.9, side = Math.abs(f.on[0]) > 0.9;
          if (front && f.len > 10) {
            // The middle of the gate: four pilasters, three wide doors, two windows over each.
            [1.1, 5.7, 10.3, 14.9].forEach((t) => K.rect(f, t - 0.4, t + 0.4, 0.7, 9.8, PIL));
            [3.4, 8, 12.6].forEach((t) => {
              K.win(f, t, 3.0, 0.7, 3.5, { frame: FRAME, fw: 0.15, bars: SASH, cols: 3, rows: [0.74] });
              K.win(f, t - 0.85, 1.1, 6.2, 2.7, { frame: FRAME, fw: 0.14, bars: SASH, rows: [0.6] });
              K.win(f, t + 0.85, 1.1, 6.2, 2.7, { frame: FRAME, fw: 0.14, bars: SASH, rows: [0.6] });
            });
            K.rect(f, 6.6, 9.4, 5.85, 6.35, DARK);           // the balconette over the doors
          } else if (front) {
            // A pavilion: quoins at both edges, one tall window to a storey.
            K.rect(f, 0, 0.55, 0.7, 9.8, PIL);
            K.rect(f, f.len - 0.55, f.len, 0.7, 9.8, PIL);
            K.win(f, f.len / 2, 1.4, 1.2, 2.9, { frame: FRAME, fw: 0.16, bars: SASH, rows: [0.64] });
            K.win(f, f.len / 2, 1.4, 6.2, 2.7, { frame: FRAME, fw: 0.16, bars: SASH, rows: [0.6] });
          } else if (side && f.len > 10) {
            // The ends, over the wing roofs: the upper storey's windows.
            [2.6, 5.4].forEach((t) => K.win(f, t, 1.2, 6.3, 2.5, { frame: FRAME, fw: 0.14, bars: SASH }));
            [f.len - 2.6].forEach((t) => K.win(f, t, 1.2, 6.3, 2.5, { frame: FRAME, fw: 0.14, bars: SASH }));
          } else if (f.len > 10) {
            for (let i = 0; i < 7; i++) {                     // the platform side
              const t = (f.len * (i + 0.5)) / 7;
              K.win(f, t, 1.2, 6.3, 2.5, { frame: FRAME, fw: 0.12 });
              K.win(f, t, 1.4, 1.2, 2.9, { frame: FRAME, fw: 0.12 });
            }
          }
        });
        // The mansard over the centre, its flat top and the iron cresting along it.
        const roofFoot = [[-13, -7.5], [13, -7.5], [13, 7.5], [-13, 7.5]];
        K.frustum(K.inset(roofFoot, 0.25), 10.5, K.inset(roofFoot, 2.0), 13.4, SLATE, "#3d434e");
        K.late(K.put([K.P(-9.5, 5.5, 13.4), K.P(9.5, 5.5, 13.4), K.P(9.5, 5.5, 13.95), K.P(-9.5, 5.5, 13.95)],
                     "rgba(24,26,32,0.72)", lit), -6);
        // The pediment over the doors, and the clock over it in its copper frame.
        const ped = K.face([[-3.4, 7.56, 10.5], [3.4, 7.56, 10.5], [0, 7.56, 12.3]], PIL, [0, 0, 10.6], 1, -34);
        if (ped) K.face([[-2.85, 7.6, 10.72], [2.85, 7.6, 10.72], [0, 7.6, 11.98]], CREAM, [0, 0, 10.6], 1, -35);
        let clockQ = null;
        K.walls([[-1.0, 5.9], [1.0, 5.9], [1.0, 7.0], [-1.0, 7.0]], 12.2, 14.2, COPPER, 9, (f) => {
          if (f.on[1] > 0.9) clockQ = f;
        }, null, -36);
        if (clockQ) {
          K.disc(clockQ, 1.0, 13.2, 0.74, "#5d8a72");
          K.disc(clockQ, 1.0, 13.2, 0.6, "#e6dfc8");
          /* The hands keep the room's own time, the clock the dusk is counted on: no claim about any
             timetable, only that the station's clock and the hall's light agree. */
          const hrs = (dayPhase() * 24) % 12, mins = (dayPhase() * 24 * 60) % 60;
          [[(hrs / 12) * 2 * Math.PI, 0.34, 0.07], [(mins / 60) * 2 * Math.PI, 0.5, 0.05]].forEach(([th, L, w]) => {
            const dt = Math.sin(th), dy = Math.cos(th), pt = Math.cos(th) * w, py = -Math.sin(th) * w;
            clockQ.at(1.0);
            K.put([clockQ.F(1.0 + pt, 13.2 + py, 0.08), clockQ.F(1.0 - pt, 13.2 - py, 0.08),
                   clockQ.F(1.0 + dt * L - pt, 13.2 + dy * L - py, 0.08),
                   clockQ.F(1.0 + dt * L + pt, 13.2 + dy * L + py, 0.08)], DARK, lit);
          });
          K.done();
        }
        K.roof(-1.15, 1.15, 5.75, 7.15, 14.2, 0.55, COPPER, { d: -37 });
        // The pavilions above the cornice: an attic, the copper frieze with its round dormers, the cap.
        for (const s of [-1, 1]) {
          const sq = s < 0 ? [[-13, 3.0], [-8, 3.0], [-8, 8.1], [-13, 8.1]] : [[8, 3.0], [13, 3.0], [13, 8.1], [8, 8.1]];
          K.walls(sq, 10.5, 11.3, CREAM, 9, (f) => K.band(f, 11.0, 11.3, BAND), null, -30);
          K.walls(sq, 11.3, 12.7, COPPER, 9, (f) => {
            if (f.on[1] > 0.9 || f.on[0] * s > 0.9) {
              K.win(f, f.len / 2, 1.4, 11.45, 1.05, { frame: SASH, fw: 0.12, rise: 0.62, lamp: 0.5 });
            }
          }, null, -30);
          K.frustum(sq, 12.7, K.inset(sq, 1.25), 15.0, SLATE, DARK, -31);
          K.spike(s * 10.5, 5.55, 15.0, 16.9, 0.09, DARK, -33);
        }
      } else if (shape === "customhouse") {
        /*
           The former Moji Customs building, 1912, on its own stand at 1:25 (round 36).

           Wikipedia (ja): built in March 1912 as the second Moji Customs house after the first burned,
           restored by the city and reopened in 1994; two storeys, 897.9 m2 of floors; OpenStreetMap's
           outline is 33.8 x 21.0 m with a gabled roof. The table model drew three storeys with the top
           one glazed end to end as an "observation floor": the building has two, and its observation
           room is upstairs behind ordinary windows -- the photographs settle it. Built from them: red
           brick over a darker brick base, white stone string courses and window surrounds, white sash
           windows, the entrance front's three round-arched doors between two corner pavilions that
           rise above the eaves to stone-capped parapets, a hipped grey slate roof with small
           copper-hooded dormers, and on the harbour side the pavilions' little green pyramid roofs.
           Heights are storeys read against the outline's width (eaves about 9.5 m); approximate.
        */
        const K = modelKit(C, m, drawn, lit, 33.8);
        const BRICK = "#a5492f", BASE = "#6c3426", STONE = "#e2dccd", SASH = "#ece8de", SLATE = "#878c94",
              COPPER = "#78a58b", DARK = "#2b2e35";
        const foot = [[-16.9, -10.5], [16.9, -10.5], [16.9, 11.0], [11.4, 11.0], [11.4, 10.5], [-11.4, 10.5],
                      [-11.4, 11.0], [-16.9, 11.0]];
        const sash = { frame: STONE, fw: 0.16, bars: SASH, rows: [0.62] };
        K.walls(foot, 0, 9.5, BRICK, 2.5, (f) => {
          K.band(f, 0, 1.0, BASE);
          K.band(f, 4.55, 4.85, STONE);                       // the string course
          K.band(f, 9.0, 9.5, STONE);                         // the cornice
          const front = f.on[1] > 0.9;
          if (front && f.len > 10) {
            // The entrance front between the pavilions: three arched doors, paired sashes over them.
            const c = f.len / 2;
            [-2.6, 0, 2.6].forEach((d) => {
              K.win(f, c + d, 1.9, 1.0, 3.35, { frame: STONE, fw: 0.3, rise: 0.95, lamp: 1.2 });
              K.win(f, c + d - 0.55, 0.85, 5.6, 2.3, sash);
              K.win(f, c + d + 0.55, 0.85, 5.6, 2.3, sash);
            });
            [-3.9, -1.3, 1.3, 3.9].forEach((d) => K.rect(f, c + d - 0.22, c + d + 0.22, 4.85, 9.0, STONE));
            [-8.6, -5.5, 5.5, 8.6].forEach((d) => {
              K.win(f, c + d, 1.1, 1.5, 2.4, sash);
              K.win(f, c + d, 1.1, 5.6, 2.4, sash);
            });
          } else if (front) {
            // A pavilion: two tall narrow lights below, one window above under a segmental stone head.
            K.win(f, f.len / 2 - 0.55, 0.72, 1.4, 2.7, sash);
            K.win(f, f.len / 2 + 0.55, 0.72, 1.4, 2.7, sash);
            K.win(f, f.len / 2, 1.5, 5.55, 2.3, { frame: STONE, fw: 0.28, rise: 0.36, bars: SASH, cols: 2, rows: [0.6] });
          } else if (f.len > 4) {
            // The sides and the harbour front: arched pairs below, square pairs above.
            const n = Math.max(2, Math.round(f.len / 3.6));
            for (let i = 0; i < n; i++) {
              const t = (f.len * (i + 0.5)) / n;
              K.win(f, t - 0.5, 0.8, 1.4, 2.6, { frame: STONE, fw: 0.14, rise: 0.4, bars: SASH, cols: 1, rows: [0.6] });
              K.win(f, t + 0.5, 0.8, 1.4, 2.6, { frame: STONE, fw: 0.14, rise: 0.4, bars: SASH, cols: 1, rows: [0.6] });
              K.win(f, t, 1.8, 5.6, 2.3, { frame: STONE, fw: 0.16, bars: SASH, cols: 2, rows: [0.6] });
            }
          }
        });
        // The hipped slate roof, its dormers, and the pavilions standing up through its corners.
        K.roof(-17.2, 17.2, -10.8, 10.8, 9.5, 4.6, SLATE);
        [-7.5, -2.5, 2.5, 7.5].forEach((uc) => {
          K.dormer(uc, 8.4, 1.0, 0.85, 10.8, 9.5, 0, 14.1, "#b7b2a6", COPPER, { frame: SASH, rise: 0.5 });
        });
        for (const s of [-1, 1]) {
          const fr = s < 0 ? [[-16.9, 5.5], [-11.4, 5.5], [-11.4, 11.0], [-16.9, 11.0]] : [[11.4, 5.5], [16.9, 5.5], [16.9, 11.0], [11.4, 11.0]];
          K.walls(fr, 9.5, 11.3, BRICK, 9, (f) => { K.band(f, 9.5, 9.75, STONE); K.band(f, 10.95, 11.3, STONE); }, null, -30);
          K.lid(fr, 11.3, "#5a5d62", -30);
          // the stone gablet each entrance pavilion carries over its parapet, a low segmental arch
          const gu = s < 0 ? -14.15 : 14.15, arc = [];
          for (let i = 0; i <= 8; i++) arc.push([gu + 1.9 * Math.cos((i / 8) * Math.PI), 11.06, 11.3 + 0.95 * Math.sin((i / 8) * Math.PI)]);
          K.face(arc, STONE, [gu, 8, 11.4], 1, -32);
          const bk = s < 0 ? [[-16.9, -10.5], [-11.9, -10.5], [-11.9, -5.5], [-16.9, -5.5]] : [[11.9, -10.5], [16.9, -10.5], [16.9, -5.5], [11.9, -5.5]];
          K.walls(bk, 9.5, 10.7, BRICK, 9, (f) => K.band(f, 10.45, 10.7, STONE), null, -30);
          K.frustum(bk, 10.7, K.inset(bk, 2.4), 12.6, COPPER, null, -31);
        }
      } else if (shape === "osakashosen") {
        /*
           The former Osaka Shosen building, 1917, on its own stand at 1:25 (round 36).

           Wikipedia (ja): the Moji branch of the Osaka Shosen line, designed by Kawai Ikuji; timber, two
           storeys, partly brick-form concrete; 670 m2 on the ground (OpenStreetMap's outline, 32.1 x
           22.4 m, gives 648). What it is known by is in the same article and in every photograph: the
           corner window under a great arch and the octagonal tower over it, Secession work, and the
           "vivid colour of the facing brick" -- orange, in grey stone bands, not the pale render the
           table model wore. So: orange walls banded grey over a grey base, tall sashes upstairs, broad
           openings below, a balustrade along the eaves and a blue slate mansard with small arched
           dormers behind it; on the chamfered corner the two-storey arched window with its lattice,
           and over it the tower -- banded drum, balcony, a lantern of windows, a green copper dome and
           its finial; on the far end a raised parapet with a round window. Heights are the storeys and
           the photographs' proportions (tower to cornice about two to one); approximate.
        */
        const K = modelKit(C, m, drawn, lit, 32.1);
        const ORANGE = "#c46d38", GREY = "#9a9a94", PALE = "#c9c6bb", SLATE = "#4f5d78", COPPER = "#4f7d66",
              SASH = "#dcd8cc", DARK = "#2b2e35";
        // The footprint with its corner cut where the tower stands (front-left).
        const foot = [[-16.05, -11.2], [16.05, -11.2], [16.05, 11.2], [-12.05, 11.2], [-16.05, 7.2]];
        K.walls(foot, 0, 10.0, ORANGE, 2.7, (f) => {
          K.band(f, 0, 0.9, GREY);                            // the stone base
          [1.75, 2.65, 3.55].forEach((y) => K.band(f, y, y + 0.24, GREY));   // the banded ground floor
          K.band(f, 4.5, 5.05, GREY);                         // the string course
          K.band(f, 5.55, 5.75, GREY);
          K.band(f, 9.35, 10.0, GREY);                        // the cornice
          if (f.len < 7) {
            // The cut corner: the arched window through both storeys, its lattice, its stone hood.
            const t = f.len / 2;
            K.win(f, t, 3.3, 1.2, 7.7, { frame: PALE, fw: 0.42, rise: 1.65, glass: "#2a323c", bars: PALE,
                                         cols: 4, rows: [0.17, 0.34, 0.51, 0.68, 0.85] });
            return;
          }
          const n = Math.max(2, Math.round(f.len / 3.1));
          for (let i = 0; i < n; i++) {
            const t = (f.len * (i + 0.5)) / n;
            K.win(f, t, 1.0, 5.95, 2.9, { frame: SASH, fw: 0.12, bars: SASH, rows: [0.58] });
            if (i % 2 === 0 || f.len < 25) K.win(f, t, 1.9, 0.9, 3.0, { frame: PALE, fw: 0.22, bars: SASH, cols: 2, rows: [0.7] });
          }
        });
        // The balustrade along the eaves, a gutter behind it, and the mansard set back from it.
        K.walls(foot, 10.0, 10.85, PALE, 2.8, (f) => {
          const n = Math.max(1, Math.round(f.len / 1.2));
          for (let i = 0; i < n; i++) {
            const t = (f.len * (i + 0.5)) / n;
            K.rect(f, t - 0.32, t + 0.32, 10.18, 10.68, "#5c5d5b");
          }
        });
        K.lid(foot, 10.85, "#55585c");
        const mFoot = K.inset(foot, 1.3), mTop = K.inset(foot, 3.2);
        const slopes = K.frustum(mFoot, 10.85, mTop, 13.0, SLATE, "#3f4859");
        // Small arched dormers along the front slope.
        for (let i = 0; i < 5; i++) {
          const uc = -8 + i * 5.2;
          K.dormer(uc, 9.6, 0.95, 0.85, 9.9, 10.85, 8.0, 13.0, PALE, SLATE, { round: true, frame: SASH, rise: 0.5 });
        }
        // The far end's raised parapet with its round window.
        let endF = null;
        K.walls([[15.85, -3.0], [16.15, -3.0], [16.15, 3.0], [15.85, 3.0]], 10.0, 11.6, PALE, 9, (f) => {
          if (f.on[0] > 0.9) endF = f;
        }, null, -8);
        if (endF) {
          K.disc(endF, 3.0, 10.95, 0.9, GREY);
          K.disc(endF, 3.0, 10.95, 0.62, "#2a323c");
          K.done();
        }
        K.face([[16.15, -3.0, 11.6], [16.15, 3.0, 11.6], [16.15, 0, 12.5]], PALE, [15.0, 0, 11.0], 1, -8);
        // The tower over the cut corner: banded drum, balcony, lantern, dome, finial.
        const tu = -13.1, tv = 8.25, rot = Math.PI / 8 + Math.PI / 4;
        const drum = K.ngon(tu, tv, 3.0, 8, rot);
        K.walls(drum, 10.0, 14.6, ORANGE, 9, (f) => {
          [11.3, 12.95].forEach((y) => K.band(f, y, y + 0.22, GREY));
          if (f.on[1] > 0.2 || f.on[0] < -0.2) K.win(f, f.len / 2, 0.75, 11.75, 1.0, { frame: SASH, fw: 0.1 });
          K.band(f, 14.3, 14.6, GREY);
        }, null, -40);
        const deck = K.ngon(tu, tv, 3.45, 8, rot);
        K.walls(deck, 14.6, 14.95, GREY, 9, null, null, -41);
        K.lid(deck, 14.95, "#77786f", -41);
        K.walls(K.ngon(tu, tv, 2.45, 8, rot), 14.95, 18.0, PALE, 9, (f) => {
          K.win(f, f.len / 2, 1.05, 15.45, 2.05, { frame: SASH, fw: 0.1, bars: SASH, rows: [0.5] });
        }, null, -42);
        K.walls(deck.map((p) => [tu + (p[0] - tu) * 0.97, tv + (p[1] - tv) * 0.97]), 14.95, 15.7, PALE, 9, (f) => {
          for (let i = 0; i < 3; i++) K.rect(f, (f.len * (i + 0.2)) / 3, (f.len * (i + 0.8)) / 3, 15.08, 15.55, "#5c5d5b");
        }, null, -43);
        const crown = K.ngon(tu, tv, 2.75, 8, rot);
        K.walls(crown, 18.0, 18.4, GREY, 9, null, null, -42);
        K.dome(tu, tv, 2.55, 18.4, 2.0, 8, rot, COPPER, -43);
        K.spike(tu, tv, 20.3, 21.9, 0.09, DARK, -44);
      } else if (shape === "dalianhall") {
        /*
           The Dalian Friendship Memorial Hall, on its own stand at 1:25 (round 36).

           Wikipedia (ja): a 1995 reinforced-concrete copy, three storeys and 806 m2 of floors, of the
           Chinese Eastern Railway steamship office the Russian Empire built in Dalian in 1902, put up for
           the fifteenth year of Kitakyushu's friendship with Dalian (the building in Dalian is itself a
           copy now); OpenStreetMap's outline is 30.9 x 18.1 m. The table model gave it a tower stepping
           square to octagonal to round; the photographs show something else, and this is built from
           them: red brick striped with white stone every course or so over a grey stone base, white
           sash windows, on the left a half-timbered gable -- white render, dark red-brown timbers --
           over a bay with a stone balustrade, the entrance under a stone arch with its fanlight, and
           right of it the polygonal tower, banded like the walls, a timbered frieze under its eaves and
           a tall dark octagonal spire with a dormer gablet and a finial; dark hipped roofs with small
           dormers, tall brick chimneys with white caps, and a lower wing to the right. Heights are
           storeys read against the outline's width; approximate.
        */
        const K = modelKit(C, m, drawn, lit, 30.9);
        const BRICK = "#a24b36", STONE = "#e4dfd2", BASE = "#a29e93", SASH = "#efebe2", TIMBER = "#5c2b24",
              RENDER = "#e6e0d2", ROOF = "#3a3c42", DARK = "#2b2e35";
        const stripes = (f, top) => {
          K.band(f, 0, 1.1, BASE);
          for (let y = 2.0; y < top - 0.6; y += 1.1) K.band(f, y, y + 0.3, STONE);
          K.band(f, top - 0.4, top, STONE);
        };
        // From far off the stripes are under a pixel; the wall then takes their mix rather than reading
        // as plain red brick.
        const BRICKW = K.seen(0.3) ? BRICK : "#b4705f";
        const sash = { frame: STONE, fw: 0.12, bars: SASH, rows: [0.6] };
        // The main block, its left bay projecting under the gable.
        const foot = [[-15.45, -9.05], [7.0, -9.05], [7.0, 9.05], [-7.0, 9.05], [-7.0, 10.5], [-15.45, 10.5]];
        K.walls(foot, 0, 10.0, BRICKW, 3.0, (f) => {
          stripes(f, 10.0);
          const front = f.on[1] > 0.9;
          if (front && f.len < 10) {
            // under the gable: two sashes below, a broad three-light window above
            K.win(f, f.len / 2 - 1.9, 1.2, 1.7, 2.4, sash);
            K.win(f, f.len / 2 + 1.9, 1.2, 1.7, 2.4, sash);
            K.win(f, f.len / 2, 3.6, 5.9, 2.2, { frame: STONE, fw: 0.14, bars: SASH, cols: 3, rows: [0.62] });
          } else if (front) {
            // the entrance under its stone arch, and the windows either side
            K.win(f, 3.5, 1.7, 1.1, 3.4, { frame: STONE, fw: 0.42, rise: 0.85, glass: "#d9d4c8", lamp: 0.5 });
            [1.4, 5.6].forEach((t) => K.win(f, t, 0.95, 1.7, 2.3, sash));
            [1.4, 3.5, 5.6].forEach((t) => K.win(f, t, 0.9, 5.9, 1.9, sash));
          } else if (f.len > 4) {
            const n = Math.max(2, Math.round(f.len / 3.4));
            for (let i = 0; i < n; i++) {
              const t = (f.len * (i + 0.5)) / n;
              K.win(f, t, 1.0, 1.7, 2.3, sash);
              K.win(f, t, 1.0, 5.9, 2.0, sash);
            }
          }
        }, [1]);
        // The main block's right wall shows only in front of the wing and above it.
        K.walls([[7.0, 7.0], [7.4, 7.0], [7.4, 9.05], [7.0, 9.05]], 0, 10.0, BRICKW, 9, (f) => stripes(f, 10.0), [3]);
        // The lower wing to the right.
        const wing = [[7.0, -9.05], [15.45, -9.05], [15.45, 7.0], [7.0, 7.0]];
        K.walls(wing, 0, 8.0, BRICKW, 3.0, (f) => {
          stripes(f, 8.0);
          const n = Math.max(2, Math.round(f.len / 3.2));
          for (let i = 0; i < n; i++) {
            const t = (f.len * (i + 0.5)) / n;
            K.win(f, t, 0.95, 1.7, 2.2, sash);
            K.win(f, t, 0.95, 5.0, 1.9, sash);
          }
        }, [3]);
        K.roof(7.0, 15.75, -9.35, 7.3, 8.0, 3.3, ROOF);
        K.dormer(11.4, 5.6, 0.9, 0.8, 7.3, 8.0, 2.9, 11.3, RENDER, ROOF, { round: true, frame: SASH, rise: 0.45 });
        // The main roof, the half-timbered gable over the left bay, the dormers and the chimneys.
        K.roof(-15.75, 7.3, -9.35, 9.35, 10.0, 5.0, ROOF);
        [-4.6, -1.6].forEach((uc) => K.dormer(uc, 7.4, 0.9, 0.85, 9.35, 10.0, 0, 15.0, RENDER, ROOF,
                                               { round: true, frame: SASH, rise: 0.45 }));
        // The cross-gable's ridge meets the hipped roof at its own ridge (15 m), as the photographs
        // show it; run higher and longer, it stood up out of the roof as a slab seen from the side.
        const gq = K.face([[-15.45, 10.5, 10.0], [-7.0, 10.5, 10.0], [-11.22, 10.5, 15.0]], RENDER, [-11.2, 5, 11], 1, -20);
        K.face([[-15.85, 10.9, 9.65], [-11.22, 10.9, 15.25], [-11.22, 0.3, 15.25], [-15.85, 0.3, 9.65]], ROOF, [-11.2, 5, 10], 1, -18);
        K.face([[-6.6, 10.9, 9.65], [-11.22, 10.9, 15.25], [-11.22, 0.3, 15.25], [-6.6, 0.3, 9.65]], ROOF, [-11.2, 5, 10], 1, -18);
        if (gq) {
          const g = K.plane(-15.45, 10.5, gq);
          const tb = (pts) => { g.at(); K.put(pts.map(([t, y]) => g.F(t, y, 0.06)), K.mix(TIMBER, g.shade), lit); };
          tb([[0.3, 10.75], [8.15, 10.75], [8.15, 11.05], [0.3, 11.05]]);           // the tie beam
          tb([[4.08, 11.05], [4.37, 11.05], [4.37, 14.7], [4.08, 14.7]]);          // the king post
          tb([[0.9, 11.05], [1.2, 11.05], [3.95, 13.6], [3.65, 13.6]]);            // the braces
          tb([[7.55, 11.05], [7.25, 11.05], [4.5, 13.6], [4.8, 13.6]]);
          tb([[0.0, 9.95], [0.45, 9.95], [4.42, 14.85], [4.05, 15.15]]);           // the bargeboards
          tb([[8.45, 9.95], [8.0, 9.95], [4.03, 14.85], [4.4, 15.15]]);
          K.win(g, 4.22, 1.0, 11.6, 1.15, { frame: SASH, fw: 0.1, bars: SASH, rows: [0.55] });
          K.done();
        }
        // The balcony in front of the bay: a slab and its stone balustrade.
        K.walls([[-13.1, 10.5], [-9.4, 10.5], [-9.4, 11.5], [-13.1, 11.5]], 4.95, 5.95, STONE, 9, (f) => {
          const n = Math.max(1, Math.round(f.len / 0.55));
          for (let i = 0; i < n; i++) K.rect(f, (f.len * (i + 0.25)) / n, (f.len * (i + 0.75)) / n, 5.2, 5.75, "#8d8a83");
        }, [0], -16);
        [[-6.2, -1.6, 10.0, 17.3], [12.0, -3.0, 8.0, 13.6]].forEach(([cu, cv, y0, y1]) => {
          const ch = [[cu - 0.45, cv - 0.45], [cu + 0.45, cv - 0.45], [cu + 0.45, cv + 0.45], [cu - 0.45, cv + 0.45]];
          K.walls(ch, y0, y1, BRICK, 9, (f) => K.band(f, y1 - 0.45, y1, STONE), null, -22);
          K.lid(ch, y1, STONE, -22);
        });
        // The tower: banded polygon, timbered frieze, eaves, the spire with its gablet, the finial.
        const tu = 3.5, tv = 8.3, rot = Math.PI / 8, body = K.ngon(tu, tv, 3.0, 8, rot);
        K.walls(body, 0, 12.4, BRICKW, 9, (f) => {
          stripes(f, 12.4);
          if (f.on[1] > 0.3) {
            K.win(f, f.len / 2, 0.85, 1.8, 2.2, sash);
            K.win(f, f.len / 2, 0.85, 5.9, 2.0, sash);
            K.win(f, f.len / 2, 0.75, 9.3, 1.6, sash);
          }
        }, null, -30);
        K.walls(body, 12.4, 13.6, RENDER, 9, (f) => {
          K.rect(f, 0, 0.18, 12.4, 13.6, TIMBER);
          K.put([f.F(0.3, 12.45), f.F(0.55, 12.45), f.F(f.len - 0.3, 13.55), f.F(f.len - 0.55, 13.55)], K.mix(TIMBER, f.shade), lit);
        }, null, -31);
        const eave = K.ngon(tu, tv, 3.45, 8, rot);
        K.walls(eave, 13.6, 13.8, DARK, 9, null, null, -32);
        K.spire(eave, 13.8, [tu, tv, 23.0], ROOF, -33);
        // the gablet on the spire's front face
        const gb = K.face([[tu - 0.75, tv + 3.05, 14.3], [tu + 0.75, tv + 3.05, 14.3], [tu + 0.75, tv + 3.05, 15.5],
                           [tu, tv + 3.05, 16.5], [tu - 0.75, tv + 3.05, 15.5]], RENDER, [tu, tv, 14.5], 1, -36);
        if (gb) {
          const g = K.plane(tu - 0.75, tv + 3.05, gb);
          K.win(g, 0.75, 0.62, 14.55, 1.05, { frame: SASH, fw: 0.08, rise: 0.31, lamp: 0.5 });
          K.done();
        }
        K.spike(tu, tv, 23.0, 24.5, 0.08, DARK, -37);
      } else if (shape === "retrohighmart") {
        /*
           Mojiko Retro High Mart, the six-node footprint from OSM way 292429354, shown separately
           at 1:25. The 127 m nominal top (including the rooftop helipad) is CVU/CTBUH's listing,
           corroborated by the building's own Japanese Wikipedia article (127 m, highest point) and
           the AIJ landscape-history paper (127 m highest point; 126.95 m, measured 127.4 m, by the
           tower's architectural record); Kitakyushu City and MLIT describe the public observation
           view at 103 m. OSM's height=115 tag has no traceable origin and was not adopted — but no
           source gives the roof-slab height either, so neither number is a surveyed elevation.
           A Nippon.com photograph (gu900211, image 1668287) documents the light pier-and-spandrel
           grid over dark teal glass, the dark X-braced transfer band, open crown frame and white
           curved cap; it is visual evidence, not a measured elevation, and does not identify the
           band as a structural transfer floor. The 31-floor rhythm, band position and roof framing
           are deliberately approximate, not a guessed floor schedule or roof plan.
        */
        const poly = Array.isArray(m.footprint) && m.footprint.length >= 3
          ? m.footprint.map(([u, v]) => [Number(u), Number(v)])
          : [[-m.w / 8, -m.d / 8], [m.w / 8, -m.d / 8], [m.w / 8, m.d / 8], [-m.w / 8, m.d / 8]];
        const u0 = Math.min(...poly.map((p) => p[0])), u1 = Math.max(...poly.map((p) => p[0]));
        const v0 = Math.min(...poly.map((p) => p[1])), v1 = Math.max(...poly.map((p) => p[1]));
        const widthM = u1 - u0, K = modelKit(C, m, drawn, lit, widthM);
        const totalH = m.h / K.k, observationH = Math.min(totalH, m.observation || 103);
        const floors = Math.max(2, Math.round(m.floors || 31)), floorH = observationH / floors;
        const bodyH = floorH * (floors - 1);
        // The grid re-read against the sourced photograph (round 41): light gray piers and spandrels
        // stand out against dark teal window glass, and the transfer band's X-members are the same
        // light structure as the piers, standing over a recessed dark inset — the round-40 frame read
        // them the wrong way round, mid-gray on dark, which is why the band vanished at 2 m.
        const FACADE = "#8f9795", BASE = "#535b5d", SPANDREL = "#a7adaa", FRAME = "#424b4e";
        const GLASS = "#37564f", OBS_GLASS = "#48706b", TRANSFER = "#2f383c", BRACE = "#9aa2a2";
        const transferY = Math.round((floors - 1) * 0.43) * floorH, transferH = floorH * 1.45;

        // Thirty lower storeys lead to the glazed public room on floor 31. One window per broad bay
        // and a light spandrel per floor reproduce the photographed rhythm without claiming a plan.
        K.walls(poly, 0, bodyH, FACADE, 4.6, (f) => {
          K.band(f, 0, 1.0, BASE);
          for (let floor = 0; floor < floors - 1; floor++) {
            const y = floor * floorH, top = y + floorH;
            if (y < transferY + transferH && top > transferY) continue;
            K.band(f, top - 0.14, top, SPANDREL);
            const bay = f.len / f.n;
            const ww = Math.min(1.75, bay * 0.46), wh = Math.min(2.05, floorH - 1.25);
            for (let b = 0; b < f.n; b++) {
              const tc = (f.len * (b + 0.5)) / f.n;
              K.win(f, tc, ww, y + 0.60, wh,
                    { frame: FRAME, fw: 0.12, glass: GLASS, bars: "#aab2ae", cols: 2, rows: [0.55], lamp: 0.55 });
            }
          }
          // The band is put 8 cm proud of the wall face instead of riding `K.band`'s flush 5 cm:
          // the Three.js path draws `__flat` batches without polygonOffset, so quads coplanar
          // with their own wall are resolved by batch order and the band lost to the facade it
          // sits on (the deleted Canvas2D path, which sorted by the painter's own key, drew it fine — the
          // shape of a bug only one of the two renderers shows). The X-members stay proud of the
          // band, at 9 cm. One `seen` gate covers band and braces, as it once covered both.
          if (K.seen(transferH, 0.8)) {
            for (let b = 0; b < f.n; b++) {
              const lo = (f.len * b) / f.n, hi = (f.len * (b + 1)) / f.n;
              f.at((lo + hi) / 2);
              K.put([f.F(lo, transferY, 0.08), f.F(hi, transferY, 0.08),
                     f.F(hi, transferY + transferH, 0.08), f.F(lo, transferY + transferH, 0.08)],
                    K.mix(TRANSFER, f.shade), lit * 1.08);
              const pad = Math.min(0.28, (hi - lo) * 0.08), thick = Math.min(0.18, (hi - lo) * 0.045);
              const low = transferY + 0.22, high = transferY + transferH - 0.22;
              K.put([f.F(lo + pad, low, 0.09), f.F(lo + pad + thick, low, 0.09),
                     f.F(hi - pad, high, 0.09), f.F(hi - pad - thick, high, 0.09)], K.mix(BRACE, f.shade), lit * 1.05);
              K.put([f.F(hi - pad - thick, low, 0.09), f.F(hi - pad, low, 0.09),
                     f.F(lo + pad + thick, high, 0.09), f.F(lo + pad, high, 0.09)], K.mix(BRACE, f.shade), lit * 1.05);
            }
          }
        }, null, -16);

        // The 31st-floor observation room is a single transparent band placed at the published
        // 103 m viewing datum. Sources do not give its exact floor elevation or ceiling, so the band
        // straddles that datum rather than pretending to be a surveyed floor schedule.
        K.walls(poly, bodyH, observationH, "#5b6668", 4.6, (f) => {
          K.band(f, bodyH, bodyH + 0.18, FRAME);
          K.band(f, observationH - 0.22, observationH, FRAME);
          const bay = f.len / f.n, ww = Math.min(2.65, bay * 0.64);
          for (let b = 0; b < f.n; b++) {
            const tc = (f.len * (b + 0.5)) / f.n;
            K.win(f, tc, ww, bodyH + 0.42, observationH - bodyH - 0.78,
                  { frame: FRAME, fw: 0.15, glass: OBS_GLASS, bars: "#aab9b7", cols: 2, rows: [0.56], lamp: 0.72 });
          }
        }, null, -18);
        K.lid(poly, observationH, "#4b5457", -18);

        // An open, braced crown frame stands between the observation room and the curved roof cap.
        const frameBase = observationH, frameTop = Math.max(frameBase + 1, totalH - 9);
        const frameFoot = [[-3.0, -2.5], [3.0, -2.5], [3.0, 2.5], [-3.0, 2.5]];
        const postSize = 0.42;
        for (const [u, v] of [[-2.78, -2.28], [2.78, -2.28], [2.78, 2.28], [-2.78, 2.28]]) {
          const post = [[u - postSize / 2, v - postSize / 2], [u + postSize / 2, v - postSize / 2],
                        [u + postSize / 2, v + postSize / 2], [u - postSize / 2, v + postSize / 2]];
          K.walls(post, frameBase, frameTop, FRAME, 1e6, null, null, -23);
          K.lid(post, frameTop, FRAME, -23);
        }
        [frameBase + 0.18, frameBase + (frameTop - frameBase) * 0.52, frameTop - 0.42].forEach((y) =>
          K.walls(frameFoot, y, y + 0.28, "#596164", 6.2, null, null, -23));
        const braceBase = frameBase + 0.42, braceTop = frameTop - 0.42, braceMid = (braceBase + braceTop) / 2;
        const frameBar = (pts) => K.face(pts, BRACE, [0, 0, braceMid], 1, -25);
        const lu = -2.48, ru = 2.48, lv = -1.98, rv = 1.98, t = 0.23;
        for (const side of [-1, 1]) {
          const v = side * 2.49, u = side * 3.0;
          frameBar([[lu, v, braceBase], [lu + t, v, braceBase], [ru, v, braceTop], [ru - t, v, braceTop]]);
          frameBar([[ru - t, v, braceBase], [ru, v, braceBase], [lu + t, v, braceTop], [lu, v, braceTop]]);
          frameBar([[u, lv, braceBase], [u, lv + t, braceBase], [u, rv, braceTop], [u, rv - t, braceTop]]);
          frameBar([[u, rv - t, braceBase], [u, rv, braceBase], [u, lv + t, braceTop], [u, lv, braceTop]]);
        }

        // A shallow elliptical shell and a curved front fascia echo the distinctive cap in the
        // sourced photograph. The cap's exact radius, profile and structural details are not known.
        const capBase = frameTop, capH = Math.max(1, totalH - capBase), capU = 12.0, capV = 7.8;
        const capFoot = [];
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          capFoot.push([capU * Math.cos(a), capV * Math.sin(a)]);
        }
        const capRings = 4, capSegments = 20;
        for (let ring = 0; ring < capRings; ring++) {
          const a0 = (ring / capRings) * Math.PI / 2, a1 = ((ring + 1) / capRings) * Math.PI / 2;
          const u0 = capU * Math.cos(a0), v0 = capV * Math.cos(a0), y0 = capBase + capH * Math.sin(a0);
          const u1 = capU * Math.cos(a1), v1 = capV * Math.cos(a1), y1 = capBase + capH * Math.sin(a1);
          for (let i = 0; i < capSegments; i++) {
            const t0 = (i / capSegments) * Math.PI * 2, t1 = ((i + 1) / capSegments) * Math.PI * 2;
            const c0 = [Math.cos(t0), Math.sin(t0)], c1 = [Math.cos(t1), Math.sin(t1)];
            const pts = ring < capRings - 1
              ? [[u0 * c0[0], v0 * c0[1], y0], [u0 * c1[0], v0 * c1[1], y0],
                 [u1 * c1[0], v1 * c1[1], y1], [u1 * c0[0], v1 * c0[1], y1]]
              : [[u0 * c0[0], v0 * c0[1], y0], [u0 * c1[0], v0 * c1[1], y0], [0, 0, totalH]];
            K.face(pts, "#d7d9d4", [0, 0, capBase - 0.2], 1, -27);
          }
        }
        K.face(capFoot.map(([u, v]) => [u, v, capBase + 0.04]), "#929896", [0, 0, capBase + 1], 0.92, -28);
        const fascia = [[-capU, capV, capBase], [capU, capV, capBase], [capU, capV, capBase + 0.3]];
        for (let i = 20; i >= 0; i--) {
          const u = (i / 20) * capU * 2 - capU;
          const y = capBase + 0.3 + 4.0 * (1 - (u / capU) ** 2);
          fascia.push([u, capV, y]);
        }
        K.face(fascia, "#e0e1dc", [0, 0, capBase + 1], 1, -29);
      } else if (shape === "stall") {
        /* A market stall at table scale: a counter, a dark opening under a striped awning. The
           awning slopes the way an awning does and carries the stripes a market reads by; nothing
           on it is lettered. */
        const along = Math.abs(m.ry) > 45;
        const dir = along ? (m.x < 0 ? 1 : -1) : -1;
        const P = (u, v, y) => (along ? [m.x + dir * v, m.y + y, m.z + u] : [m.x + u, m.y + y, m.z + dir * v]);
        const hw = m.w / 2;
        // A low counter carries the goods; open posts and a dark rear display leave the stall
        // visibly open beneath its canvas instead of filling that space with a wooden box.
        const counterH = m.h * 0.26;
        facesOf({ ...m, h: counterH, w: m.w * 0.92, d: m.d * 0.82 }).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = f.n[1] !== 1 && PATS.wood
            ? add(C, f.p, patUV(f), "pat", PATS.wood)
            : add(C, f.p, ZERO8, "flat", mix(base, f.k - 0.08));
          if (q) { q.lit = lit; drawn.push(q); }
        });
        const topY = counterH;
        const counterTop = add(C, [P(-hw * 0.46, m.d * 0.45, topY), P(hw * 0.46, m.d * 0.45, topY),
                                   P(hw * 0.46, -m.d * 0.35, topY), P(-hw * 0.46, -m.d * 0.35, topY)],
                               ZERO8, "flat", "#9b8060");
        if (counterTop) { counterTop.lit = lit * 1.05; drawn.push(counterTop); }
        const postColour = mix("#694a33", -0.02);
        [-hw * 0.44, hw * 0.44].forEach((u) => [-m.d * 0.37, m.d * 0.37].forEach((v) => {
          const px = along ? m.x + dir * v : m.x + u;
          const pz = along ? m.z + u : m.z + dir * v;
          facesOf({ ...m, x: px, z: pz, y: m.y + topY, h: m.h * 0.42, w: 4, d: 4 }).forEach((f) => {
            const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                         + f.n[2] * (C.z - f.p[0][2]);
            if (toward <= 0) return;
            const q = add(C, f.p, ZERO8, "flat", mix(postColour, f.k * 0.4));
            if (q) { q.lit = lit * 0.92; drawn.push(q); }
          });
        }));
        const rear = add(C, [P(-hw * 0.40, -m.d * 0.28, topY), P(hw * 0.40, -m.d * 0.28, topY),
                             P(hw * 0.40, -m.d * 0.28, m.h * 0.62),
                             P(-hw * 0.40, -m.d * 0.28, m.h * 0.62)],
                         ZERO8, "flat", "#382d27");
        if (rear) { rear.lit = lit * 0.62; drawn.push(rear); }
        /* The awning is the biggest thing on a stall and canvas on a frame is the only part of a
           stall that can move, so it is the awning that moves: each panel's front edge lifts and
           falls out of step with its neighbours, and the valance hangs off whatever the edge is
           doing. A thin strip of rippling cloth under a rigid awning -- which was the first attempt
           -- measured 1.6% of the stall, because it was 1.6% of the stall. */
        const n = 6;
        const edge = (i) => (ease ? Math.sin(T * 1.7 + i * 0.9 + m.z * 0.02) * 5.5 : 0);
        /* Canvas moving under light changes colour, and it is the base colour that has to change.
           `lit` only lays a warm wash over an unchanged base, and that wash is gated at lit > 0.55 --
           which in a dim hall the stalls never clear, so the first attempt swung `lit` by a quarter
           and moved nothing: mean pixel change 2 out of 765, a still photograph. `mix` shifts the
           colour itself toward light or shade with no gate. */
        const shim = (i) => (ease ? 0.24 * Math.sin(T * 2.1 + i * 0.9 + m.z * 0.02) : 0);
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * m.w - hw, a1 = ((i + 1) / n) * m.w - hw - 1.5;
          const q = add(C, [P(a0, m.d * 0.5, m.h * 0.68 + edge(i)),
                            P(a1, m.d * 0.5, m.h * 0.68 + edge(i + 1)),
                            P(a1, -m.d * 0.18, m.h * 1.0), P(a0, -m.d * 0.18, m.h * 1.0)],
                        ZERO8, "flat", mix(i % 2 ? "#b8433c" : "#e6ddca", shim(i)));
          if (q) { q.lit = lit * 1.2; drawn.push(q); }
        }
        /* The valance: a strip of canvas hanging off the awning's front edge, in the stall's two
           colours, rippling along its length on the frame clock. This is what makes a market move.
           Until this the stall's only animation was two 6x7 cm puffs of steam at 0.12 alpha, which
           measured 0.7% of the stall's pixels -- invisible, and the reason the market read as dead. */
        for (let i = 0; i < n; i++) {
          const v0 = (i / n) * m.w - hw, v1 = ((i + 1) / n) * m.w - hw - 1.5;
          const v = add(C, [P(v0, m.d * 0.5, m.h * 0.68 + edge(i)),
                            P(v1, m.d * 0.5, m.h * 0.68 + edge(i + 1)),
                            P(v1, m.d * 0.5, m.h * 0.54), P(v0, m.d * 0.5, m.h * 0.54)],
                        ZERO8, "flat", mix(i % 2 ? "#a03832" : "#d6cdba", -shim(i + 1)));
          if (v) { v.lit = lit * 1.1; drawn.push(v); }
        }
        // Steam off the produce: two thin quads that rise and thin out on the frame clock.
        for (let j = 0; j < 2; j++) {
          const ph = ease ? (T * 0.35 + j * 0.5) % 1 : 0.3;
          const sy = m.h * 0.38 + ph * 18, sa = (1 - ph) * 0.16;
          const sx = (j ? 0.3 : -0.3) * hw;
          const q = add(C, [P(sx - 3, m.d * 0.16, sy), P(sx + 3, m.d * 0.16, sy),
                            P(sx + 3, m.d * 0.16, sy + 7), P(sx - 3, m.d * 0.16, sy + 7)],
                        ZERO8, "flat", `rgba(232,232,226,${sa.toFixed(2)})`);
          if (q) { q.lit = 1.1; drawn.push(q); }
        }
        /* Produce on the counter: three small heaps in market colours. No stall is lettered, so
           colour does the selling -- and every stall used to sell the same three heaps, which made
           three stalls look like one stall printed three times. St. Lawrence is a market of
           trades, so each stall draws from its own palette, picked by where it stands: greengrocer,
           butcher, fishmonger, cheesemonger. */
        const PALETTES = [
          [["#7da05a", -0.44], ["#d08a3e", -0.06], ["#a04a3c", 0.32]],   // greengrocer
          [["#c9705e", -0.42], ["#b8543f", -0.04], ["#8e3b30", 0.3]],    // butcher
          [["#7fb6c4", -0.44], ["#a8cdd4", -0.06], ["#dce9e8", 0.3]],     // fishmonger
          [["#e0c47a", -0.44], ["#cba85c", -0.06], ["#b8924a", 0.3]],     // cheesemonger
        ];
        PALETTES[Math.abs(Math.round(m.z)) % PALETTES.length].forEach(([col, cx]) => {
          const gx = cx * hw;
          const goodsY = m.h * 0.28;
          const q = add(C, [P(gx - 8, m.d * 0.16, goodsY), P(gx + 8, m.d * 0.16, goodsY),
                            P(gx + 6, m.d * 0.16, goodsY + 7), P(gx, m.d * 0.16, goodsY + 10),
                            P(gx - 6, m.d * 0.16, goodsY + 7)],
                        new Array(10).fill(0), "flat", col);
          if (q) { q.lit = lit * 1.15; drawn.push(q); }
        });
        const fl = (0.75 + (ease ? 0.1 * Math.sin(T * 5.2 + m.z * 0.1) : 0)).toFixed(2);
        const lampq = add(C, [P(-7, m.d * 0.42, m.h * 0.58), P(7, m.d * 0.42, m.h * 0.58),
                              P(7, m.d * 0.42, m.h * 0.66), P(-7, m.d * 0.42, m.h * 0.66)],
                          ZERO8, "flat", `rgba(255,196,120,${fl})`);
        if (lampq) { lampq.lit = 1.6; lampq.nolite = true; drawn.push(lampq); }
        /* What the lamp lights. A market at night is lit by its own lamps, and this is the largest
           area on a stall that can change -- which matters, because a flat quad only registers as
           moving where its edges are until its brightness moves too. */
        const glow = add(C, [P(-hw * 0.88, m.d * 0.32, m.h * 0.2), P(hw * 0.88, m.d * 0.32, m.h * 0.2),
                             P(hw * 0.88, m.d * 0.32, m.h * 0.62), P(-hw * 0.88, m.d * 0.32, m.h * 0.62)],
                         ZERO8, "flat",
                         `rgba(255,188,116,${(0.16 + (ease ? 0.15 * Math.sin(T * 5.2 + m.z * 0.1) : 0)).toFixed(3)})`);
        if (glow) { glow.lit = 1.45; glow.nolite = true; drawn.push(glow); }
      } else if (shape === "markethall") {
        /* St. Lawrence Market South, as it stands (round 32 correction; sources in TODO §0n). The
           building is John Wilson Siddall's 1902 market hall built round the surviving centre block
           of Henry Bowyer Lane's 1845 City Hall. That rebuild took down the old hall's wings, its
           pediment and its cupola with the clock (Wikipedia; Doug Taylor), so the clock tower the
           first model carried had been gone for a hundred and twenty years. What stands: a long
           red-brick hall under one high arched roof with a clerestory (Wikipedia: "a hybrid of arch
           roof with clerestory"), and at its north end on Front Street the 1845 block -- three stone
           archways at the ground and the old council chamber over them, whose fan windows now look
           into the hall -- its outline still marked in yellow brick. Long axis north-south, as the
           table lies; nothing on it is lettered and no vendor is named. */
        const along = Math.abs(m.ry) > 45;
        const dir = along ? (m.x < 0 ? 1 : -1) : -1;
        const P = (u, v, y) => (along ? [m.x + dir * v, m.y + y, m.z + u] : [m.x + u, m.y + y, m.z + dir * v]);
        const hw = m.w / 2, hd = m.d / 2, H = m.h;
        const yE = H * 0.5, yA = H * 0.58, yC = H * 0.68, vC = hd * 0.62;
        const Zn = (n) => new Array(n * 2).fill(0);
        const Q = (pts, col, l) => {
          const q = add(C, pts, Zn(pts.length), "flat", col);
          if (q) { q.lit = l; drawn.push(q); }
          return q;
        };
        const arch = (uc, v, ar, yS, yP, rise, seg = 7) => {
          const p = [P(uc - ar, v, yS), P(uc + ar, v, yS), P(uc + ar, v, yP)];
          for (let i = 0; i <= seg; i++) {
            const t = (i / seg) * Math.PI;
            p.push(P(uc + ar * Math.cos(t), v, yP + rise * Math.sin(t)));
          }
          return p;
        };
        const warm = (k) => `rgba(255,206,140,${(k + 0.55 * NIGHT()).toFixed(3)})`;
        // The long walls: brick over a stone base, a row of tall round-headed windows.
        [hd, -hd].forEach((v, side) => {
          Q([P(-hw, v, 0), P(hw, v, 0), P(hw, v, yE), P(-hw, v, yE)], mix("#7f4234", side ? -0.2 : -0.02), lit * (side ? 0.75 : 0.95));
          Q([P(-hw, v + Math.sign(v) * 0.3, 0), P(hw, v + Math.sign(v) * 0.3, 0),
             P(hw, v + Math.sign(v) * 0.3, H * 0.06), P(-hw, v + Math.sign(v) * 0.3, H * 0.06)], "#bfb39a", lit * 0.9);
          if (side) return;
          const BAYS = 8;
          for (let i = 0; i < BAYS; i++) {
            const uc = -hw + (i + 0.5) * (m.w / BAYS), ar = (m.w / BAYS) * 0.26;
            const wq = Q(arch(uc, v + 0.4, ar, H * 0.12, H * 0.36, ar * 0.9), warm(0.12), 1.35);
            if (wq) wq.nolite = true;
          }
        });
        // Aisle roofs from the eaves in to the clerestory, then the clerestory band of windows.
        [1, -1].forEach((s) => {
          Q([P(-hw, s * hd, yE), P(hw, s * hd, yE), P(hw, s * vC, yA), P(-hw, s * vC, yA)], "#4d5761", lit * 0.82);
          Q([P(-hw, s * vC, yA), P(hw, s * vC, yA), P(hw, s * vC, yC), P(-hw, s * vC, yC)], mix("#7f4234", -0.1), lit * 0.85);
          if (s > 0) {
            for (let i = 0; i < 12; i++) {
              const u0 = -hw + (i + 0.18) * (m.w / 12), u1 = -hw + (i + 0.82) * (m.w / 12);
              const q = Q([P(u0, vC + 0.3, yA + (yC - yA) * 0.2), P(u1, vC + 0.3, yA + (yC - yA) * 0.2),
                           P(u1, vC + 0.3, yA + (yC - yA) * 0.82), P(u0, vC + 0.3, yA + (yC - yA) * 0.82)],
                          warm(0.1), 1.3);
              if (q) q.nolite = true;
            }
          }
        });
        // The arched roof: a half-round vault from clerestory to clerestory, with its ribs.
        const SEG = 7, vaultPt = (t, u) => P(u, vC * Math.cos(t), yC + (H - yC) * Math.sin(t));
        for (let i = 0; i < SEG; i++) {
          const t0 = (i / SEG) * Math.PI, t1 = ((i + 1) / SEG) * Math.PI;
          Q([vaultPt(t0, -hw), vaultPt(t0, hw), vaultPt(t1, hw), vaultPt(t1, -hw)],
            mix("#5b666e", i % 2 ? 0.04 : -0.04), lit * (0.78 + 0.18 * Math.sin((t0 + t1) / 2)));
        }
        for (let k = 1; k < 8; k++) {
          const u = -hw + (k / 8) * m.w, rib = [];
          for (let i = 0; i <= SEG; i++) rib.push(vaultPt((i / SEG) * Math.PI, u));
          for (let i = 0; i < SEG; i++) {
            const a = rib[i], b = rib[i + 1];
            Q([a, b, [b[0], b[1] + 0.8, b[2]], [a[0], a[1] + 0.8, a[2]]], "rgba(214,220,224,0.5)", 1);
          }
        }
        // The end walls follow the section: walls, aisle roofs, clerestory, and the vault's arch.
        [-hw, hw].forEach((u) => {
          const sec = [P(u, hd, 0), P(u, hd, yE), P(u, vC, yA), P(u, vC, yC)];
          for (let i = 1; i < SEG; i++) sec.push(vaultPt((i / SEG) * Math.PI, u));
          sec.push(P(u, -vC, yC), P(u, -vC, yA), P(u, -hd, yE), P(u, -hd, 0));
          Q(sec, mix("#7f4234", -0.12), lit * 0.82);
          const lun = [];
          for (let i = 0; i <= 8; i++) {
            const t = (i / 8) * Math.PI;
            lun.push(P(u + Math.sign(u) * 0.3, vC * 0.7 * Math.cos(t), yC + (H - yC) * 0.72 * Math.sin(t)));
          }
          const lq = Q(lun, warm(0.1), 1.3);
          if (lq) lq.nolite = true;
        });
        // The 1845 block at the north end: brick inside a yellow-brick outline, three stone archways,
        // and the council chamber's round-headed windows over them. Flat-topped: no pediment, no cupola.
        const bu0 = hw, bu1 = hw + m.w * 0.05, bv = hd * 0.5, bh = H * 0.84;
        Q([P(bu1, -bv, 0), P(bu1, bv, 0), P(bu1, bv, bh), P(bu1, -bv, bh)], "#8a4636", lit);
        [-bv, bv].forEach((v) => Q([P(bu0, v, 0), P(bu1, v, 0), P(bu1, v, bh), P(bu0, v, bh)], "#743a2d", lit * 0.8));
        Q([P(bu0, -bv, bh), P(bu1, -bv, bh), P(bu1, bv, bh), P(bu0, bv, bh)], "#c7b07a", lit * 0.9);
        [[-bv, -bv + 2.4], [bv - 2.4, bv]].forEach(([v0, v1]) =>
          Q([P(bu1 + 0.3, v0, 0), P(bu1 + 0.3, v1, 0), P(bu1 + 0.3, v1, bh), P(bu1 + 0.3, v0, bh)], "#c9ad6c", lit * 0.95));
        Q([P(bu1 + 0.3, -bv, bh - 2.4), P(bu1 + 0.3, bv, bh - 2.4), P(bu1 + 0.3, bv, bh), P(bu1 + 0.3, -bv, bh)],
          "#c9ad6c", lit * 0.95);
        const FP = (v, y) => P(bu1 + 0.6, v, y);
        for (let i = -1; i <= 1; i++) {
          const vc = i * bv * 0.62, ar = bv * 0.2;
          const st = [FP(vc - ar * 1.25, 0), FP(vc + ar * 1.25, 0), FP(vc + ar * 1.25, bh * 0.26)];
          for (let k = 0; k <= 7; k++) { const t = (k / 7) * Math.PI; st.push(FP(vc + ar * 1.25 * Math.cos(t), bh * 0.26 + ar * 1.2 * Math.sin(t))); }
          Q(st, "#d8cdb4", lit);
          const op = [FP(vc - ar, 0), FP(vc + ar, 0), FP(vc + ar, bh * 0.26)];
          for (let k = 0; k <= 7; k++) { const t = (k / 7) * Math.PI; op.push(FP(vc + ar * Math.cos(t), bh * 0.26 + ar * Math.sin(t))); }
          const oq = Q(op, warm(0.18), 1.3);
          if (oq) oq.nolite = true;
          const wn = [FP(vc - ar * 0.7, bh * 0.5), FP(vc + ar * 0.7, bh * 0.5), FP(vc + ar * 0.7, bh * 0.64)];
          for (let k = 0; k <= 7; k++) { const t = (k / 7) * Math.PI; wn.push(FP(vc + ar * 0.7 * Math.cos(t), bh * 0.64 + ar * 0.7 * Math.sin(t))); }
          const wq = Q(wn, warm(0.14), 1.3);
          if (wq) wq.nolite = true;
        }
      } else if (shape === "landmark") {
        /* Round 65: a landmark draws nothing at all.

           It stands for something the world already draws -- the falls over the gorge, the bridge
           across it -- so painting it would paint the falls twice. What it owns is the mark that
           says "this is a thing you can open": a small soft disc, placed by the hit-box pass from
           the landmark's own point in the world, that the visitor can find and press. It is the
           only mark in the lane that is not on a surface, and it is the answer to a visitor who
           said the waterfall was very hard to click. */
      } else if (shape === "tree") {
        /* A model tree: a trunk, and a crown that is a pinch of flock on a wire.

           The crown used to be two stacked boxes in a terrain texture, which is a box with grass
           on it: measured, the trees were the flattest things in the hall (sd 10-35 against the
           tower's 52). A diorama tree is planted by the thousand, so it is worth a billboard --
           a quad turned to face the eye, carrying a soft-edged clump of foliage. The camera's right
           is (cy, -sy) across the ground; pitch is left out, being a few degrees on a crown that
           has no top face to lose. */
        facesOf({ ...m, w: 4, d: 4, h: m.h * 0.45 }).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", "#4a3826");
          if (q) { q.lit = lit * 0.85; drawn.push(q); }
        });
        /* A tree in a model hall is wired to a fan: the crown leans and settles, slowly, and it
           does it out of step with its neighbours because the phase comes from where the tree
           stands rather than from one shared clock. The high clump leans further than the low one,
           which is the whole trick -- a crown that moves as one disc is a cardboard cut-out. */
        const ph = T * 0.85 + m.z * 0.013 + m.x * 0.021;
        const clump = (cy0, wf, tone) => {
          const yc = m.y + m.h * cy0, R = m.w * wf * 0.5;
          const sway = ease ? Math.sin(ph + cy0 * 2.2) * R * 0.55 * cy0 : 0;
          const lift = ease ? Math.cos(ph * 0.8 + cy0) * R * 0.1 : 0;
          const rx = C.cy * R + C.cy * sway, rz = -C.sy * R - C.sy * sway;
          const q = PATS.foliage
            ? add(C, [[m.x + rx, yc + R + lift, m.z + rz], [m.x - rx, yc + R + lift, m.z - rz],
                      [m.x - rx, yc - R + lift, m.z - rz], [m.x + rx, yc - R + lift, m.z + rz]],
                  [0, 0, 128, 0, 128, 128, 0, 128], "pat", PATS.foliage)
            : add(C, [[m.x + rx, yc + R + lift, m.z + rz], [m.x - rx, yc + R + lift, m.z - rz],
                      [m.x - rx, yc - R + lift, m.z - rz], [m.x + rx, yc - R + lift, m.z + rz]],
                  ZERO8, "flat", "#4c6a3a");
          if (q) { q.lit = lit * tone; drawn.push(q); }
        };
        /* Three clumps, not two: at model scale a crown 40 px across was one disc of one tone with a
           lighter disc on top -- measured sd 0.7 on `tree-f2`, the flattest prop in the hall. The
           low wide clump is darker than the ones above it, which is what a lit crown actually does,
           and the width jitters with where the tree stands so no two crowns are the same ellipse. */
        const jitter = 0.9 + ((Math.round(m.x) * 7 + Math.round(m.z) * 13) % 21) / 100;
        clump(0.40, 1.12 * jitter, 0.86);
        clump(0.6, 1.0 * jitter, 1.06);
        clump(0.84, 0.66, 1.18);      // a smaller clump above: the silhouette is not a disc
      } else if (shape === "track") {
        // Ballast and rails along the table's front edge: the strip the streetcar runs on.
        const q = add(C, [[m.x - m.w / 2, m.y + 1, m.z - m.d / 2], [m.x + m.w / 2, m.y + 1, m.z - m.d / 2],
                          [m.x + m.w / 2, m.y + 1, m.z + m.d / 2], [m.x - m.w / 2, m.y + 1, m.z + m.d / 2]],
                      [(m.x - m.w / 2) * DPM, (m.z - m.d / 2) * DPM, (m.x + m.w / 2) * DPM, (m.z - m.d / 2) * DPM,
                       (m.x + m.w / 2) * DPM, (m.z + m.d / 2) * DPM, (m.x - m.w / 2) * DPM, (m.z + m.d / 2) * DPM],
                      "pat", PATS.track);
        if (q) { q.lit = 0.9; drawn.push(q); }
      } else if (shape === "tram") {
        /* A red streetcar shuttles the track on the frame clock; reduced motion parks it mid-run.
           The window band is lit from within — a tram at night is a lantern that moves.

           It does not glide. A streetcar eases out of a stop, runs, eases into the next one and
           stands there long enough to be seen standing — the schedule is the recognisable thing,
           not the travel. A sine is a thing on a rail that is never anywhere in particular, and
           the real one slows where it stops, which is the whole reason it reads as a vehicle. */
        const A = m.w / 2 - 20;
        const dwell = 0.12, leg = 0.5 - dwell;          // a twelfth of the cycle standing still
        const smooth = (t) => t * t * (3 - 2 * t);
        const phase = (T * 0.0796) % 1;                 // one out-and-back every 12.6 s
        const at = phase < leg ? smooth(phase / leg)
                 : phase < 0.5 ? 1
                 : phase < 0.5 + leg ? 1 - smooth((phase - 0.5) / leg)
                 : 0;
        const dx = ease ? (at * 2 - 1) * A : 10;
        facesOf({ ...m, x: m.x + dx, w: 30, d: 9, h: 11 }).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", f.n[1] === 1 ? "#e8e2d6" : "#9c352c");
          if (q) { q.lit = lit * (f.n[1] === 1 ? 1.1 : 1); drawn.push(q); }
        });
        [[-1], [1]].forEach(([sd]) => {
          const q = add(C, [[m.x + dx - 12, m.y + 5, m.z + sd * 4.6], [m.x + dx + 12, m.y + 5, m.z + sd * 4.6],
                            [m.x + dx + 12, m.y + 9, m.z + sd * 4.6], [m.x + dx - 12, m.y + 9, m.z + sd * 4.6]],
                        ZERO8, "flat", "#f2dc9e");
          if (q) { q.lit = 1.4; drawn.push(q); }
        });
      } else {
        /* A card can wear a tile. The bluff under the Fallsview deck is rock: as a flat card it was
           a featureless grey slab across half a frame, and the tile is the whole difference between
           a wall and a cliff. Mapped in world centimetres, like every other built surface here. */
        const tiled = m.tile && PATS[m.tile];
        const q = tiled
          ? add(C, corners, corners.flatMap((c) => [
              (Math.abs(m.ry) > 45 ? c[2] : c[0]) * DPM, -c[1] * DPM]), "pat", PATS[m.tile])
          : add(C, corners, uv.flat(), face, base, m.pic);
        if (q) {
          q.lit = m.kind === "vending" ? 1.7 : lit;
          // A hung frame is the one thing in an alley that is lit on purpose: it keeps its own
          // contrast instead of fogging into the wall behind it, or nobody reads the photograph.
          if (m.pic) { q.air = haze(q.z) * 0.4; q.lit = Math.max(lit, 0.72); }
          if (m.kind === "sign") q.lit = 1.6;      // a lit board, blank: no invented lettering
          drawn.push(q);
        }
      }
      /* A prop carried above the floor — a model on a table, a frame or a vent on a wall — has to
         paint after the surface that carries it: the painter sorts by camera depth alone, and one
         big tabletop or wall quad otherwise swallows the thing standing on it. The bias is a nudge
         in the sort key, not in the geometry; floor props (y 0) keep the plain order. The key is
         `sz` where a painter set one (round 36: a built model files each window under its wall's
         bay with `sz`), so the nudge moves that too -- moving only `z` slid every wall 70 cm in front
         of its own windows and painted them out. */
      if (m.y > 40) drawn.forEach((q) => { q.z -= 70; if (q.sz !== undefined) q.sz -= 70; });
      m.shown = false;
      /* Round 65: a landmark draws nothing -- it stands for something the world prims already
         draw, the falls over the gorge -- and a prop with no geometry used to be culled here, which
         would have made the marker unplaceable. So a landmark gets its box from its own point in
         the world, and a fixed disc of screen for the finger: a thing that is a hundred metres off
         has to be a target you can find, not a target you have to hunt. */
      if (m.landmark) {
        // The mark sits at the landmark's own point in the world -- the middle of the falls'
        // sheet, say -- not at the middle of its bounding box: the point is what the visitor is
        // looking at, and the box is only the record's way of saying how big it is.
        const pt = camPt(C, m.x, m.y, m.z);
        if (pt.z > NEAR) {
          const R = 46;
          let sx = W * 0.5 + (focal * pt.x) / pt.z, sy = H * 0.5 + (focal * pt.y) / pt.z;
          /* Round 79: the disc is clamped into the frame, not left where the projection puts it.
             Measured with `verify-box`: at the two stops authored to look at the Horseshoe, its
             point projects to x 1128 of a 1024-wide frame (niagara stop 3, yaw -109) and to
             1161,775 (goat stop 2) -- the falls fill the picture and the mark that says "you can
             open this" is outside it, so `elementFromPoint` finds nothing there. A mark pinned to
             the edge still says which way the thing is, and it is the only mark in the lane that is
             not on a surface. Everything else about the pass is unchanged: a landmark behind the
             body is still hidden rather than pinned to the wrong edge. */
          const M = 8;
          sx = clamp(sx, R + M, W - R - M);
          sy = clamp(sy, R + M, H - R - M);
          m.el.style.visibility = "visible";
          m.el.tabIndex = m.quiet ? -1 : 0;
          m.el.style.setProperty("--padx", "0px");
          m.el.style.setProperty("--pady", "0px");
          m.el.style.transform = `translate3d(${(sx - R).toFixed(1)}px, ${(sy - R).toFixed(1)}px, 0)`;
          m.el.style.width = `${R * 2}px`;
          m.el.style.height = `${R * 2}px`;
          m.el.style.zIndex = "1200";
          m.shown = true;
          return;
        }
        m.el.style.visibility = "hidden";
        m.el.tabIndex = -1;
        return;
      }
      if (!drawn.length) { m.el.style.visibility = "hidden"; m.el.tabIndex = -1; return; }
      const q = drawn[0];
      const b = box(C, q);
      let minz = q.z;
      drawn.slice(1).forEach((other) => {          // the control wraps the object, not one face of it
        const o = box(C, other);
        b[0] = Math.min(b[0], o[0]); b[1] = Math.min(b[1], o[1]);
        b[2] = Math.max(b[2], o[2]); b[3] = Math.max(b[3], o[3]);
        minz = Math.min(minz, other.z);
      });
      b[2] -= b[0]; b[3] -= b[1];                  // corners in, size out — once, at the end
      if (b[2] > 6 && b[3] > 6 && b[0] > -40 && b[0] < W + 40 && b[1] < H + 40 && b[1] > -40) {
        m.el.style.visibility = "visible";
        m.el.tabIndex = m.quiet ? -1 : 0;     // scenery is not in the tab order either
        // Two things a hand needs and a picture does not: a press floor, and paint order that follows
        // depth. The box grows to HIT while `--padx/--pady` pull the ring back onto the silhouette, and
        // of two overlapping boxes the nearer one wins the press. In a DOM without layout these are
        // invisible to each other, which is how a click could land on the wall behind a shutter.
        const w = Math.max(HIT, b[2]), h = Math.max(HIT, b[3]);
        m.el.style.setProperty("--padx", `${((w - b[2]) / 2).toFixed(1)}px`);
        m.el.style.setProperty("--pady", `${((h - b[3]) / 2).toFixed(1)}px`);
        m.el.style.transform = `translate3d(${(b[0] - (w - b[2]) / 2).toFixed(1)}px, `
          + `${(b[1] - (h - b[3]) / 2).toFixed(1)}px, 0)`;
        m.el.style.width = `${w.toFixed(1)}px`;
        m.el.style.height = `${h.toFixed(1)}px`;
        m.el.style.zIndex = String(1200 - Math.min(1100, Math.max(0, Math.round(minz / 4))));
        m.shown = true;
      } else {
        m.el.style.visibility = "hidden";
        m.el.tabIndex = -1;
      }
    });

    quads.sort((p, q) => (q.sz ?? q.z) - (p.sz ?? p.z));
    if (threeRenderer) {
      try {
        // The backing store is the RENDER size; the projection is identical because the focal
        // length travels with it (NDC depends on focal/width, and both carry renderScale).
        // Round 65: the render's own time is measured and published. `frameMs` is the gap between
        // frames, which on a resting lane is the idle pulse's 90 ms and says nothing about the
        // picture; this is the picture's own cost, and it is the number that decides whether a
        // machine can walk.
        const rT0 = performance.now();
        threeRenderer.render({ camera: C, width: RW, height: RH, focal: focal * (RW / Math.max(1, W)), time: T, quads,
                              day: DAY(), dayPage: DAYPAGE, night: NIGHT(), sunAz: sunAz(),
                              fogMax: FOG_MAX, dayGain: DAY_GAIN,
                              effects: { lamps, wires, marks, surfaces, wall: WALL, ceil: CEIL,
                                zBack: Z_BACK, zFar: Z_FAR, phase: phaseNow(), reducedMotion: reduce() } });
        renderMs = renderMs ? renderMs * 0.7 + (performance.now() - rT0) * 0.3 : performance.now() - rT0;
      } catch (err) {
        // Round 54: there is no second picture to degrade into. The renderer retires, the lane says
        // so in its own words, and the compiled state (hits, list, rail) keeps answering the keys.
        const failed = threeRenderer;
        threeRenderer = null;
        try { if (failed.dispose) failed.dispose(); } catch (_) {}
        layer.dataset.walkRenderer = "off";
        if (window.console && typeof console.warn === "function") console.warn("Three.js frame failed; the lane stops rendering:", err);
        const note = layer.querySelector("[data-walk-fallback]");
        if (note) note.hidden = false;
        noteOffline();
      }
    }
    mirrorWhere();
  };

  const liveEl = layer.querySelector("[data-walk-live]");
  const say = (status, record) => {
    if (status && statusEl) statusEl.textContent = status;
    // A running demonstration owns the record line until its envelope dies (act's `data-demo`
    // channel sets the hold): otherwise a standing place-announcement wipes the one sentence that
    // explains why the bridge is moving, and the line is also the screen reader's live region.
    if (record !== undefined && recordEl && !recordEl.dataset.demoHold) recordEl.textContent = record;
    // The card is where the sentence can be read, so it is kept in step with the announced one while
    // it is open: a line that goes stale behind a click is worse than no line at all.
    if (liveEl && card && !card.hidden) {
      liveEl.textContent = [status, record].filter(Boolean).join(" ") || "Nothing is in front of you.";
    }
    mirrorWhere();
  };
  const metres = (v) => `${(Math.abs(v) / 100).toFixed(1)} m`;

  /* Two claimants for one line, and the line is also the live region a screen reader follows: what you
     are standing in front of, and where you are standing. The thing in front wins, always — a station
     name that arrives a frame later used to overwrite the reach announcement and left the readout
     describing the floor while a shutter was a metre away and offered. The station is what the line
     falls back to when nothing is in reach, which is the only order that is true in both directions. */
  const sayPlace = () => {
    if (here >= 0 && hereFar < 240) say(`${labels[here]} · ${metres(depth)} in`, "");
  };
  const markStops = () => {
    let best = -1, far = Infinity;
    stopZ.forEach((z, i) => {
      const d = Math.abs(z - depth);
      if (d < far) { far = d; best = i; }
    });
    here = best; hereFar = far;
    if (best === hereShown) return;
    hereShown = best;
    stops.forEach((el, i) => el.classList.toggle("is-here", i === here));
    if (!reach) sayPlace();
  };
  // The chip's name lives in `aria-label` now, because nothing is written on the display any more;
  // splitting it is the whole difference between an announced status and a painted one.
  const labels = stops.map((el) => (el.getAttribute("aria-label") || "").split(",")[0].trim());

  /* The reach: what you can open is decided by where you stand and where you look, so the scene
     answers before anything is pressed, and `E` is never a guess. */
  const a = () => (yaw * Math.PI) / 180;
  /* Round 65: a hand's reach, or a look.

     The reach used to be one number -- 190 cm, a hand's reach -- and it was the reason the owner
     could not click a waterfall. A shopfront ten metres away, the SkyWheel fifteen metres off,
     the falls a hundred and fifty metres down the gorge: every one of them was out of reach, so
     the only way to open any of them was to find a 44-pixel box on the picture and click it, and
     the bigger and further the thing was, the harder that was.

     So there are two reaches now. A thing you can *touch* -- a shutter, a door, a stall counter --
     is in reach within a hand's reach. A thing you can only *look at* is in reach when you face
     it, from as far as the lane can see it: the shopfronts, the rides, the water, the model
     halls, and the landmarks, which stand for something too large to stand next to. The nearest
     of the two wins, as before, so a doorway still wins over a marquee behind it. */
  const LOOK_KINDS = new Set(["front", "shopbay", "foodstall", "wheel", "carousel", "incline", "pool",
    "island", "falls", "ship", "boat", "drawbridge", "stationfront", "customhouse", "osakashosen",
    "dalianhall", "retrohighmart", "tower", "skyline", "dome", "track", "tram", "massing", "gate",
    "portal", "deckwall", "glassfloor", "plinth", "hall", "hallbase", "hallplaster", "figure", "art",
    "academic", "identity", "poster", "vending"]);
  const FAR_REACH = 8000;          // cm: how far a thing you can only look at still answers
  /* Round 75 -- the way out of a room answers from the room, not from arm's length.
     Every walk page hangs its exit `133` cm beyond the lane's own near edge (the prop is authored at
     z −46 and pushed out by `Z_SCALE`), and the first stop of a room is not at that edge: Goat
     Island's is 116 cm in, Mojiko's 174, the CN Tower's 58. Measured on all five lanes with an exit
     (`.verify/_stops.mjs`, `_reach.mjs`): at the stop the visitor arrives on, turning round and
     pressing E did **nothing** on Goat Island, Mojiko and the CN Tower -- the one object on the page
     that is unmistakably a door failed its own press, which is the defect class the owner named twice
     (round 73: 「按了沒反應」). A doorway is not a shop window: you press it while walking at it, and
     350 cm covers every page's first stop with room to spare (174 + 133 = 307). */
  const EXIT_REACH = 350;
  /* Round 71: the finger's verb had no handle. A tap anywhere on the picture opened the card of
     whatever was in reach, and measured in `.verify/_popup-audit.mjs` that was 25 taps out of 25 on
     an empty canvas -- the whole screen was a button, and every prop the visitor walked past could
     interrupt them. The owner's words: "many unnecessary objects pop this window; it disrupts
     operating the scene". So the scene is look-only for a tap now, and this bar is the verb: it
     appears only while something is in reach, it carries that thing's own name, and nothing else on
     the screen presses anything. */
  const openBtn = layer.querySelector("[data-walk-open]");
  /* A landmark answers from anywhere the lane can see it. The Horseshoe's brink is three hundred
     and seventy metres from the promenade and the mark is a fixed disc on the picture, so a
     reach that stopped at eighty metres would put a mark on the screen that the lane never
     mentions -- and a visitor would learn that the mark does not mean anything. */
  const LANDMARK_REACH = 60000;
  const checkReach = () => {
    const fx = Math.sin(a()), fd = Math.cos(a());
    // Which frame you are standing at is asked on every frame, not only when the reach changes. Three
    // returns below end this function early, and a station highlight that went stale because a shrine
    // happened to be in front of you would be the kind of lie the rail tells without meaning to.
    markStops();
    /* Two kinds of answer, in the order a visitor means them.

       Everything you can press is one pool and the nearest thing in it wins, which is the rule
       the lane has always used and the one a visitor expects: what is in front of me, not what
       is nearer along the pavement. A thing you can only look at -- a shopfront, a ride, a
       marquee -- answers from further off, and still only when you face it.

       A landmark -- the water, the bridge -- is the thing the district is named for, and it
       outranks the pool: a visitor who has turned to the falls must not be handed the funicular
       that happens to be nearer along the lane, which is what the nearest-wins rule alone did
       to the one mark that mattered most. */
    let near = null, nearD = Infinity;     // the nearest thing you can press
    let mark = null, markD = Infinity;     // a landmark
    meta.forEach((m) => {
      if (m.quiet) return;                 // scenery is not a verb: it does not answer
      const dx = m.x - x, dd = m.z - depth;
      const dist = Math.hypot(dx, dd);
      const isMark = m.landmark === true;
      const isLook = isMark || LOOK_KINDS.has(m.kind);
      const isExit = m.el.dataset.verb === "leave";
      const limit = isMark ? LANDMARK_REACH : (isLook ? FAR_REACH : (isExit ? EXIT_REACH : REACH));
      if (dist > limit) return;
      const facing = dist < 4 ? 1 : (dx * fx + dd * fd) / dist;
      if (facing < (isLook ? 0.2 : 0.35)) return;
      // A tie is settled the way the old single pool settled it: the later prop wins, so a
      // model standing on its plinth is the thing you get, not the table it stands on.
      if (isMark) { if (dist <= markD) { mark = m; markD = dist; } return; }
      if (dist <= nearD) { near = m; nearD = dist; }
    });
    const best = mark || near;
    if (best && best.el === (reach && reach.el)) { reach = best; return; }
    if (reach) reach.el.classList.remove("is-reach");
    reach = best;
    if (!best) {
      layer.classList.remove("has-reach");
      if (openBtn) { openBtn.hidden = true; openBtn.setAttribute("aria-label", "Open what is in front of you"); }
      sayPlace();
      return;
    }
    best.el.classList.add("is-reach");
    // One non-verbal signal for the whole display: the note button carries a dot while there is
    // something to read about what is in front of you.
    layer.classList.add("has-reach");
    const title = best.el.dataset.title || "";
    const verb = verbOf(best.el);
    if (openBtn) {
      openBtn.hidden = false;
      openBtn.textContent = title;
      // The bar says what the press does *and* what it is: 「Read · The Horseshoe」 is a promise the
      // visitor can decline, and it is the one place the two kinds of answer stay distinguishable
      // before anything opens.
      openBtn.dataset.verb = verb ? `${VERB_WORD[verb][0]} · ` : "";
      openBtn.setAttribute("aria-label", `${verb ? VERB_WORD[verb][0] : "Open"} ${title}`);
    }
    /* A landmark is measured across the gorge, not along the lane: the falls are three hundred
       and seventy metres away in a straight line and a hundred and eighty along the promenade,
       and "183 metres ahead" would be a number about the pavement rather than about the water. */
    const where = best.landmark
      ? `${metres(Math.hypot(best.x - x, best.z - depth))} away`
      : `${metres(best.z - depth)} ahead`;
    say(`${title} · ${where}`, verb ? VERB_WORD[verb][1] : "");
  };

  /* Round 74 -- what a press will do, said before the press.
     The generator stamps one word on every pressable prop (`data-verb`, from `press_verb` in
     _gen_html.py), and it is the *weakest* thing the object can offer: a door leaves, a print shows
     photographs, a lift opens, and only a thing with nothing to show asks to be read. This table is
     the only place that word becomes language, so the bar, the reach prompt and the record line
     cannot describe the same press three different ways. The device's own idiom is the reason the
     entry is a noun+verb pair rather than a sentence: the bar is a pill, and the prompt one line. */
  const VERB_WORD = {
    leave: ["Walk through", "Press E to go through."],
    photos: ["Photographs", "Press E to see the photographs."],
    ride: ["Ride", "Press E to ride."],
    play: ["Play", "Press E to play."],
    try: ["Try", "Press E to see it move."],
    use: ["Use", "Press E to use it."],
    read: ["Read", "Press E to read the record."],
  };
  const verbOf = (el) => (el && VERB_WORD[el.dataset.verb] ? el.dataset.verb : "");

  const wrapYaw = (degrees) => ((degrees + 180) % 360 + 360) % 360 - 180;
  let cornerAssist = 0;   // which side of a corner the creep last chose; see the wedge branch
  let slideDir = 0;       // the direction of the last accepted slide; see the dead zone below
  const moveBody = (nextX, nextDepth, dt = 0.0166) => {
    // Sweep insurance: any candidate hop longer than 2.6 cm is walked in micro-steps through the
    // same axis logic, so no frame of any speed — run, glide, a slow browser's long dt — can
    // resolve a start-free/end-free pair that crosses a thin wall between them. The field calls
    // this continuous collision; the engineless demos get it by clamping steps instead.
    const hz0 = halfAt(nextDepth);
    const gx = clamp(nextX, -hz0, hz0), gz = clamp(nextDepth, MIN_D, MAX_D);
    const startX = x, startD = depth;
    const hopX = gx - startX, hopD = gz - startD;
    const hops = Math.max(1, Math.ceil(Math.max(Math.abs(hopX), Math.abs(hopD)) / 2.6));
    if (hops > 1) {
      // each micro-step advances from wherever the last one ended — a slide or a push-out made
      // there is carried, not fought — in the pattern the character controllers call stepping.
      let moved = 0;
      for (let i = 1; i <= hops; i++) moved += moveStep(x + hopX / hops, depth + hopD / hops, dt / hops);
      return moved;
    }
    return moveStep(gx, gz, dt);
  };
  const moveStep = (nextX, nextDepth, dt = 0.0166) => {
    // A body resting inside a margin — after a respawn next to a plinth, a clipped glide target —
    // leaves it on the next move rather than standing frozen inside the geometry (the push-out
    // every collision solver needs after its reject test; the probe called this ESCAPE-FAIL risk).
    const trapped = pushAt(x, depth);
    if (trapped) {
      x = clamp(x + trapped.nx * trapped.p, -halfAt(depth), halfAt(depth));
      depth = clamp(depth + trapped.nz * trapped.p, MIN_D, MAX_D);
    }
    const oldX = x, oldDepth = depth;
    const cx = clamp(nextX, -halfAt(nextDepth), halfAt(nextDepth));
    const cz = clamp(nextDepth, MIN_D, MAX_D);
    let nx2 = oldX, nz2 = oldDepth, blockedX = false, blockedD = false;
    if (!collidesAt(cx, oldDepth)) nx2 = cx; else blockedX = true;
    if (!collidesAt(nx2, cz)) nz2 = cz; else blockedD = true;
    let projected = false;
    if ((blockedX || blockedD) && (cx !== oldX || cz !== oldDepth)) {
      /* The slide. Take the contact normal, slide the intended move along its tangent, and push
         that candidate clear — the same order of operations as the pointer-lock demo's slide, kept
         continuous so a diagonal touch against a plinth's face turns into walking past it instead
         of standing at it with the keys doing nothing.

         Round 65: this used to run only when *both* axes were refused, which is the corner and
         not the wall. A body that walks into a long face is refused on one axis only — the other
         one is free — and the solver answered that by killing the blocked axis and stopping dead,
         which is the oldest way to make a control scheme feel broken: the visitor presses forward,
         the body stops, and nothing on the screen says why. The field's answer is the slide: the
         press that survives is the one along the face, and the body goes on past it. So the branch
         runs whenever the move was refused, and the tangent it tries is the face's own. */

      const hit = pushAt(cx, cz) || pushAt(oldX, oldDepth);
      if (hit) {
        const tX = -hit.nz, tD = hit.nx;
        let along = (cx - oldX) * tX + (cz - oldDepth) * tD;
        // the wall clamp zeroes the into-wall velocity after every frame, so a braced body's
        // per-frame candidate can be almost nothing — the wedge slide must read the WISH, not
        // only what the blocked candidate happened to carry this frame; the two agree whenever
        // the walk is free and this branch does not run.
        const wishAlong = (vx * tX + vd * tD) * dt;
        if (Math.abs(wishAlong) > Math.abs(along)) along = wishAlong;
        /* Round 73: the dead zone is a speed, not a distance. The 1.9 cm this used to ask for is
           exactly 115 cm/s at a 16.6 ms frame -- the creep's own speed -- but a step is not always a
           frame: `moveBody` walks any hop longer than 2.6 cm in micro-steps, so an ordinary 2.8 cm
           frame at full walking speed arrives here as two 1.4 cm hops, each below a fixed 1.9, and
           every frame spent against a long face was read as "straight into a corner". The assist
           then crept the body toward the room's centre at 115 cm/s while the visitor pressed on
           along the face: measured in the Moji hall (`.verify/_aisleprobe.cjs`), a body walking east
           along the port table stalled at x 368 with the aisle behind it closing. Scaled by the
           step's own dt, the same threshold means the same thing at any frame length and any
           sub-sampling, and a body pressing along a face slides instead of being dragged back. */
        const deadAlong = 115 * dt;
        if (Math.abs(along) < deadAlong) {
          // Straight into a corner: the bisector leaves neither face a tangent to ride, and W+A
          // is exactly 45° to an axis-aligned box — the old solver's signature freeze. Assist it
          // like the 2-D games do: pick the side whose next steps are clear and creep round it,
          // remembering the choice so the two faces cannot alternate the body between them.
          const creep = 115 * dt;
          const clear = (sgn) => {
            let px = oldX, pd = oldDepth;
            for (let k = 0; k < 4; k++) {
              // round 54 review: the half is read at the candidate's own depth — `pd`, because the
              // wedge steps (px, pd) together; the rebuild wrote `halfAt(pz)`, a name the solver
              // never had, and any body that crept round a corner died mid-tick on all pages.
              // Round 68: the step has to be *taken*, not clamped. A creep heading into the lane's
              // own wall was clamped onto the wall and reported clear, so at a prop corner beside
              // a wall the solver picked the wall side on every frame, the clamp ate the step, and
              // the body stood still beside a face it could walk along (`_wedge2` caught it at
              // x=-431 with `clear:[1,1]` and a 0.51 cm hop that cancelled itself). The lane
              // boundary is a face like any other: a side that the wall refuses is not clear.
              const qx = px + tX * sgn * creep, qd = pd + tD * sgn * creep;
              if (clamp(qx, -halfAt(qd), halfAt(qd)) !== qx || clamp(qd, MIN_D, MAX_D) !== qd) return 0;
              px = qx; pd = qd;
              if (collidesAt(px, pd)) return 0;
            }
            return 1;
          };
          let sgn = cornerAssist
            || (clear(1) === clear(-1)
                 ? (-(Math.sign(oldX) || 1) * tX >= 0 ? 1 : -1)      // both clear: round the inner side
                 : (clear(1) ? 1 : -1));
          if (!clear(sgn)) sgn = -sgn;
          cornerAssist = clear(sgn) ? sgn : 0;
          if (cornerAssist) along = creep * cornerAssist;
        }
        let sx = clamp(oldX + tX * along, -halfAt(depth), halfAt(depth));
        let sd = clamp(oldDepth + tD * along, MIN_D, MAX_D);
        const h2 = pushAt(sx, sd);
        if (h2) {
          /* Round 68: a tenth of a millimetre of clearance after the push-out.
             `pushAt` resolves by exactly `pen = R - dist`, so the resolved point sits ON the
             surface the accept test below then asks about with a strict `<`. Rounding decides
             that comparison, and when it falls on the wrong side the body is refused the one
             step it had found — every frame, at the same corner, with the keys held
             (`_wedge2`: ladder southeast corner, `h2.p` 0.07, `col:true`, move 0, a clear 45°
             exit). Clearance makes the answer the solver's rather than the FPU's; a hundredth
             of a centimetre is far below anything the eye or the body can spend. */
          const clear2 = h2.p + 0.01;
          sx = clamp(sx + h2.nx * clear2, -halfAt(depth), halfAt(depth));
          sd = clamp(sd + h2.nz * clear2, MIN_D, MAX_D);
        }
        // The dead zone is anti-flip-flop, not anti-slow: buzz means the normal alternating and
        // the slide reversing — a reversal pays the 1.2 cm threshold, a monotone creep never does,
        // and a first accepted slide has no history to contradict. (The old formulation also gated
        // the FIRST acceptance on the threshold: a 0.69 cm/frame tangent — 41 cm/s, an ordinary
        // angled press — was refused, could never set slideDir, and froze four fukuoka braced
        // holds at 0.2 cm/s with a legal 45° exit.)
        const hop2 = Math.hypot(sx - oldX, sd - oldDepth);
        const dir = along > 0.01 ? 1 : along < -0.01 ? -1 : 0;
        const buzz = dir !== 0 && slideDir !== 0 && dir !== slideDir;
        /* Round 68: the wedge creep does not pay the reversal price.
           `buzz` remembers the direction of the last accepted slide so two faces cannot alternate
           the body between them — but the memory is keyed to the direction alone, and it outlives
           the face that taught it. A body rounding a prop's corner keeps the memory of the face it
           came from; the new face's only clear creep is 115 cm/s times this step's dt, and at the
           sub-sampled 8.3 ms that is 0.96 cm, so the 1.2 cm reversal it is charged can never be
           afforded and the body stands between the two faces with a legal way out. The gate caught
           eight of these in one run on rooms.html (round 68) — every one with `clear:[1,0]` or
           `[0,1]`, `collidesAt(sx,sd) === false`, a clear 45° exit, and `hop2` 0.955 refused by
           `buzz`. A 60 Hz frame at one hop creeps 1.9 cm and passed, which is why the same wedge
           was only ever seen on a slow frame. The creep is already guarded by its own memory
           (`cornerAssist`, which cannot alternate) and by the four-step clearance test above, so
           the direction it chose is an answer, not a buzz. */
        const wedged = cornerAssist !== 0;
        if (!collidesAt(sx, sd) && hop2 > 0.01 && (wedged || !buzz || hop2 > 1.2)) {
          nx2 = sx; nz2 = sd; blockedX = false; blockedD = false;
          if (dir) slideDir = dir;
        }
        // kill only the component into the face — whether the slide ran or not, so the tangent
        // keeps its momentum and the blunt zeroing never starves the ramp the dead zone waits for
        const into = vx * hit.nx + vd * hit.nz;
        if (into < 0) { vx -= hit.nx * into; vd -= hit.nz * into; }
        projected = true;
      }
    }
    if (!projected && blockedX && Math.abs(cx - oldX) > 0.001) vx = 0;
    if (!projected && blockedD && Math.abs(cz - oldDepth) > 0.001) vd = 0;
    if (!projected) { cornerAssist = 0; slideDir = 0; }   // a free axis: the creep stands down
    x = nx2; depth = nz2;
    if (Math.abs(Math.abs(x) - halfAt(depth)) < 0.5) vx = 0;
    if (depth === MIN_D || depth === MAX_D) vd = 0;
    return Math.hypot(x - oldX, depth - oldDepth);
  };
  /* An auto-walk must not strand the visitor where a stand happens to cross its line (round 41:
     `wall-probe` measured rail glides aborting 581 to 1849 cm short in the Journey lane). When the
     straight line is blocked, aim around it: the nearest strip of free floor with body room ahead and
     beside, on either side; once the stop's own x is clear again ahead, home back onto it. If no
     width has a legal side — a full-width railing, a plinth in a 2.4 m tunnel — the glide still
     gives up, because being walled off from a stop is truer than pretending through it. */
  const detourAround = () => {
    if (!gliding) return false;
    /* Round 69: the strip is chosen from the stop's own line, not from wherever the body was just
       thrown, and an existing detour is *widened* rather than recomputed. Re-centring on the thrown
       body made every recomputation pick a different side, so the glide followed the shove instead of
       going round anything. */
    const base = gliding.origX === undefined ? x : gliding.origX;
    const first = gliding.origX === undefined ? 20 : Math.max(20, Math.abs(x - base) + 20);
    for (let off = first; off <= 320; off += 20) {
      for (const sg of (base >= x ? [1, -1] : [-1, 1])) {
        const gx = clamp(base + sg * off, -halfAt(depth), halfAt(depth));
        if (Math.abs(gx - x) < 12 && gliding.origX === undefined) continue;   // the wall ate it: no strip there
        if (collidesAt(gx, depth) || collidesAt(gx, Math.min(depth + 150, gliding.to))) continue;
        if (gliding.origX === undefined) gliding.origX = gliding.x;
        gliding.x = gx;
        return true;
      }
    }
    return false;
  };
  const homeGlide = () => {
    if (!gliding || gliding.origX === undefined || gliding.origX === gliding.x) return;
    // Round 69: not before the side lane is reached. Homing mid-cross reset the target to the stop's
    // line every frame, which re-armed the sidestep every frame, and the body never advanced at all
    // (measured: 0 cm in 120 s). The detour is finished only when the body is standing on it.
    if (Math.abs(x - gliding.x) > 12) return;
    /* Round 64: the walk home looked at ONE point 150 cm ahead and called the line clear when
       that point was clear. A body pressed against a lamp post was therefore sent straight back
       onto its line the moment the post was 150 cm behind it, and the glide ping-ponged between
       the line and the detour and never got round anything at all — the visitor was left standing
       in the lane with a chip that promised an arrival. Home now waits until the line is clear
       the whole way along, not clear at one step. */
    /* Round 69: the scan started 120 cm ahead, and a body *beside* a shop bay therefore read its own
       line as clear — home fired on the next frame, re-aimed straight into the bay, was thrown out,
       detoured again, and ping-ponged there for as long as the visitor waited (`_rail.mjs`: x between
       206 and 343 at z 962, never closer to the stop). A line is clear from where the body *is*, so
       the body's own point is tested first, and the first metre is walked in 30 cm steps instead of
       120 — a bay's footprint is about that deep, and the coarse step stepped over it. */
    if (collidesAt(gliding.origX, depth)) return;
    const to = Math.min(gliding.to, depth + 900);
    for (let d = depth + 30; d <= to; d += d <= depth + 300 ? 30 : 120) {
      if (collidesAt(gliding.origX, d)) return;     // still box alongside: stay on the detour
    }
    gliding.x = gliding.origX;
    delete gliding.origX;
  };

  // One motion step, in the pipeline vocabulary adopted in round 46 (Mint spatial-contracts §2):
  // inputs (held keys, a rail glide's target, a jump's nudge) are read as INTENT — desired motion,
  // never positions; constraints (walls, height, reach, the comfort clamp on RUN) resolve that intent
  // against the committed state; x/depth/yaw are committed once, at the bottom; and only then does
  // anything present (draw, the plate, the guide strip, `__walk`). Presentation never moves the
  // body, and no consumer — test, instrument, or guide — samples render geometry to learn where the
  // body is: they read the committed state, which is why a claim about movement and a measurement of
  // it can never diverge by construction.
  const stepMotion = (dt, glideOnly = false) => {
    if (gliding) {
      /* Round 69 — 撞到先側移, 再前進.
         A detour used to keep aiming at the stop while it moved sideways, so the step was a diagonal
         straight into the very bay it was trying to avoid: the solver pushed the body back out, the
         glide re-aimed, and the visitor travelled 1100 cm in 40-90 s of visible judder (`_rail.mjs`,
         measured; a 7 s walk on a clear line). While a detour is in force and the side lane has not
         been reached, the step's depth target is *here* — pure lateral motion, which the solver
         handles without a fight — and only then does the glide advance along the lane at the new x.
         Normal glides are untouched: with no detour in force this is the same diagonal it always was. */
      const sidestep = gliding.origX !== undefined && Math.abs(x - gliding.x) > 6;
      const aimX = gliding.x, aimZ = sidestep ? depth : gliding.to;
      const dx = aimX - x, dd = aimZ - depth;
      const distance = Math.hypot(dx, dd);
      if (!sidestep && distance < 1.2) {
        moveBody(gliding.x, gliding.to);
        if (Math.hypot(gliding.x - x, gliding.to - depth) < 1.2) gliding = null;
      } else if (distance > 0.001) {
        const stride = Math.min(distance, (gliding.speed || GLIDE_SPEED) * dt);
        const moved = moveBody(x + dx * stride / distance, depth + dd * stride / distance);
        const remaining = Math.hypot(aimX - x, aimZ - depth);
        /* Round 69 — 撞到就繞, and "撞到" is measured in progress, not in displacement.
           `moved` is what the body did, and a push-out is also something the body did: a rail glide
           whose straight line clips a shop bay was shoved 70 cm sideways every frame, `moved` read
           70, the detour never fired, and the visitor juddered between x 206 and x 343 at z 962 for
           as long as they stood there (`.verify/_rail.mjs`; the gate that reported it was called
           flaky for two rounds). The question a glide has to ask is "did I get closer to the place
           I promised", so it is asked in those terms: a step that does not close at least half the
           distance it meant to close is blocked, however far the body was thrown.
           `moved` is kept — a body that moved nothing at all is still worth a detour without the
           arithmetic — and a solid with no room round it still ends the glide, because being walled
           off from a stop is truer than pretending through it (round 41). */
        const gained = distance - remaining;
        const progressed = gained >= stride * 0.5;
        if (!sidestep && remaining < 1.2) gliding = null;
        else if (!progressed || moved < 0.001) {
          /* Round 75: a hard glide (a stop, a frame's own approach) is a promise about a place, so
             when the solver cannot get round whatever is in the way it finishes the move rather than
             cancelling it. A soft glide still gives up: the body must not be placed somewhere the
             visitor did not ask to be. */
          if (!detourAround()) { if (gliding.hard) finishGlide(); else gliding = null; }
        } else homeGlide();
      }
    } else if (!glideOnly) {
      /* Round 74: this used to `return` here, and the `return` skipped `rideStep` at the bottom of
         the function -- so the Falls Incline announced "You ride the Falls Incline…", took the keys
         away, and then never moved the car. The one interaction whose entire point is a visible
         change was the one with no change at all (`.verify/_rideprobe.mjs`, height 0 for 2.4 s after
         the press). The keys still wait; the car no longer does. */
      if (!ride) {   // the car carries you; the keys wait
        /* Round 65: A and D turn the head, the way every first-person lane is driven.

           They used to strafe, with the arrows turning instead, and that is a scheme nobody arrives
           with: a visitor who presses D expects to look right, and here the world slid sideways
           under them instead -- which is why the movement read as broken rather than as unusual.
           The stick on a touch screen still strafes (it has to: there is no A and D on a phone), and
           the strafe is gone from the keyboard, where it was never what anybody wanted. */
        let mx = stick ? stick.x : 0, md = stick ? -stick.y : 0;
        if (keys.has("w") || keys.has("arrowup")) md += 1;
        if (keys.has("s") || keys.has("arrowdown")) md -= 1;
        const len = Math.hypot(mx, md) || 1;
        const r = keys.has("shift") ? RUN : 1;
        // WASD and the stick live in the view plane, not the room's fixed axes. `camPt` maps a
        // camera-forward step to (sin(yaw), cos(yaw)) in the lane, and camera-right to
        // (cos(yaw), -sin(yaw)); using the same basis here keeps movement and the view aligned after
        // either a drag or a turn key. Pitch is intentionally excluded so looking up never lifts the
        // walker off the floor. Turning remains rate-limited for comfort.
        const heading = a(), sy = Math.sin(heading), cy = Math.cos(heading);
        const wishX = ((mx * cy) + (md * sy)) / len * SPEED * r;
        const wishD = ((-mx * sy) + (md * cy)) / len * SPEED * r;
        // the pointer-lock demo's model, measured against ours: input frames set the velocity —
        // no ramp to feel like skating — and only a released body decays (tau 90 ms: gone inside
        // a step and a half, no drift past the wall the old 400 ms exponential eased through).
        if (mx || md) { vx = wishX; vd = wishD; }
        else { const dmp = Math.exp(-dt / 0.09); vx *= dmp; vd *= dmp;
               if (Math.hypot(vx, vd) < 1.2) { vx = 0; vd = 0; } }
        moveBody(x + vx * dt, depth + vd * dt);
      }
    }
    if (ride) rideStep();
    const gh = ride ? height : floorAt(depth, x);
    if (!ride && gh > height) height = Math.min(gh, height + 1500 * dt);   // the stair rises to meet you
    if (!ride && !glideOnly && height > gh + 0.5 && vy <= 0 && Math.hypot(vx, vd) > 1)
      vy = Math.min(vy, -1500);   // and steps off it: leaving the deck walks down, not falls for ten seconds
    if (height > gh || vy !== 0) {
      vy -= GRAV * dt;
      const nextHeight = height + vy * dt;
      // the ceiling cap is measured from the floor you stand on, so a jump off the overlook deck
      // has the same air as a jump in a corridor even though the deck itself is 18 m up
      height = clamp(nextHeight, gh, gh + MAX_HEIGHT);
      if (height === gh + MAX_HEIGHT && vy > 0) vy = 0;
      if (height === gh) vy = 0;
    }
  };

  /* One pumped frame of the ride: a smooth climb (or drop) between the two decks over RIDE_T
     seconds, easing out at the far end. Movement keys are off while this runs (see stepMotion);
     the record holds until the last step releases it. */
  const rideStep = () => {
    const t = (performance.now() - ride.t0) / RIDE_T / 1000;
    const k = sm01(Math.min(1, t));
    height = ride.h0 + (ride.h1 - ride.h0) * k;
    x = ride.x0 + (ride.x1 - ride.x0) * k;
    vy = 0;
    if (t >= 1) {
      const done = ride;
      ride = null;
      height = floorAt(depth, x);
      if (recordEl) { delete recordEl.dataset.demoHold; recordEl.textContent = ""; }
      if (done.say) say("", done.say);
    }
  };
  const boardRide = (el) => {
    if (ride) return true;   // already in a car; a second press is the ride, not a queue
    const up = height < 900;
    const xIn = Number(el.dataset.rideX || 300);
    ride = {
      t0: performance.now(), h0: height, x0: x,
      h1: up ? Number(el.dataset.rideTop || 2990) : 0,
      x1: xIn,
      say: up ? "You step off at the top, onto the Fallsview deck, level with the bluff's lip."
              : "You step off at the bottom, by the rail, with the falls a short walk east.",
    };
    if (recordEl) {
      recordEl.dataset.demoHold = "1";
      recordEl.textContent = "You ride the Falls Incline: 59.8 m of track at 30 degrees, two cars pulling "
                           + "each other up and down. The real crossing takes 62 seconds; this model keeps "
                           + "the climb to three.";
    }
    // the same redraw contract the hour button and the demonstrations use: the loop must be awake
    // for the length of the ride, and the announcement must survive one frame of it
    const pump = () => {
      if (!ride) return;
      tick(performance.now());
      pulse = setTimeout(pump, 33);
    };
    if (pulse) clearTimeout(pulse);
    pulse = setTimeout(pump, 33);
    return true;
  };

  const tick = (t) => {
    raf = 0;
    const tickT0 = performance.now();
    /* Round 56, and this one was the difference between "slow" and "broken": the simulation used
       to throw away every part of a frame longer than 120 ms. A frame longer than 120 ms is exactly
       what a software rasteriser produces (measured here: 250 ms at 1024×640), so the body moved at
       a fraction of its authored speed and turned at a fraction of its authored rate — the walk got
       slower the weaker the machine, which reads as a laggy control scheme and is really a clock
       that disagrees with the wall. Time is now kept up to a quarter of a second, the physics
       subsamples at 25 ms (so a long frame is ten small steps, not one leap and no wall
       tunnelling), and the governor below attacks the frame length itself. The ceiling still
       discards a real suspension — a background tab, a sleeping laptop — rather than teleporting
       the visitor down the lane. */
    let rawGap = last ? Math.max(0, (t - last) / 1000) : 0.016;
    /* A gap only counts if the previous frame was actually being pumped. The lane rests on a timer
       rather than a frame loop, so the interval between two resting ticks is real time that nobody
       spent moving — and replaying it is a lurch: round 56 measured the first frame after a 680 ms
       rest travelling 82 cm, which reads as the camera being kicked. Resuming therefore restarts the
       clock; a frame that interrupts *held* input still gets its whole gap, because that gap is
       motion the visitor was asking for while the machine took its time. */
    if (!pumping) rawGap = Math.min(rawGap, 0.05);
    /* Round 65: the walk keeps the wall clock's time, even when the machine cannot keep up.

       The half-second ceiling was there to stop a *suspension* -- a hidden tab, a sleeping laptop --
       from being replayed as travel down the lane, and against that it is right. But a machine
       that draws one frame every 0.6 s is not suspended, it is slow, and the ceiling was eating
       the difference: measured here, holding W on a software rasteriser, the model believed it
       was walking at 165 cm/s while the body covered 101 -- the walk ran in slow motion and the
       picture could not keep up with it, which is exactly what "the controls are terrible" feels
       like. A held key is motion the visitor asked for, so a held key's frame is spent whole: the
       ceiling for a held walk is two seconds, and the suspension case is already covered by the
       visibility and blur handlers, which let go of the keys and the velocity when the page goes
       away. */
    const holding = ["w", "a", "s", "d", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"]
      .some((k) => keys.has(k));
    const elapsed = Math.min(holding ? 2 : 0.5, rawGap);
    last = t;
    /* The frame budget governor. Samples the frame's own length and moves the render scale toward
       a playable cadence: below ~22 fps it gives up resolution, above ~45 fps it takes it back.
       It never touches the display geometry, and it never runs on a page whose renderer refused
       (there is no picture to budget). One step per ~0.6 s, ±10–12% at a time, clamped between
       the display's own floor and 1: it is a governor, not a finder — a scale that swings per
       frame is its own judder. */
    if (threeRenderer && rawGap > 0 && !FULL_RENDER) {
      // the sample is the real gap: measuring the capped value would let a 600 ms frame pass for a
      // 500 ms one and the governor would settle a step above what the machine can actually draw
      frameMs = frameMs ? frameMs * 0.8 + Math.min(1.5, rawGap) * 1000 * 0.2 : Math.min(1.5, rawGap) * 1000;
      frameSamples++;
      if (!frameBudgetAt) frameBudgetAt = t;
      if (t - frameBudgetAt > 400 && frameSamples > 3) {
        frameBudgetAt = t; frameSamples = 0;
        const before = renderScale;
        // 24 fps is the floor this is trying to hold (a walk is steerable there; below it the
        // picture stops answering the keys), 45 fps the ceiling it gives resolution back to.
        // Round 65: the step is quicker and larger, because a lane that takes four seconds to
        // notice the machine is slow spends those four seconds at three frames a second.
        const floor = minRenderScale();
        if (frameMs > 42 && renderScale > floor) renderScale = Math.max(floor, renderScale - 0.16);
        else if (frameMs < 22 && renderScale < 1) renderScale = Math.min(1, renderScale + 0.1);
        if (renderScale !== before) { applyRenderScale(); layer.dataset.walkScale = renderScale.toFixed(2); }
      }
    }
    /* A press that no frame saw still moves the visitor: the input is not tied to the picture's
       clock. A tap of D that begins and ends between two frames is paid out here, once, in the
       direction the visitor pressed -- a hundred and twenty milliseconds of motion, which is one
       slow frame's worth. A press a frame did see is left to the held path above, so a long hold
       is never counted twice and the walk never gains a step it was not given. */
    /* Round 71: the head turns in the visitor's own time, not in the frame's.

       The turn used to be integrated inside the motion step, with the frame's dt -- and a frame on a
       software rasteriser is 47 ms, so a tap the visitor held for 12 ms was paid 47 ms of turn. The
       same flick therefore turned four times as far on a slow machine as on a fast one, and on the
       build before this change it measured 8-9 degrees for a tap. What the visitor pressed is the
       key, for as long as it was down; that is what gets paid: the frame's share, but never more
       than the key has actually been held, and a press shorter than a nudge is topped up to
       TURN_TAP_MS. A tap on a 60 Hz machine is ~3 degrees and the same tap on a 21 Hz machine is the
       same 3 degrees. */
    const turnDir = (keys.has("d") || keys.has("arrowright") ? 1 : 0)
                  - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    if (turnDir && !gliding) {
      const nowMs = performance.now();
      let paidMs = 0;
      for (const k of ["a", "arrowleft", "d", "arrowright"]) {
        const tap = tapState.get(k);
        if (!tap || !tap.start) continue;
        paidMs = Math.max(paidMs, Math.min(elapsed * 1000, nowMs - tap.start));
      }
      if (paidMs > 0) {
        yaw = wrapYaw(yaw + turnDir * TURN_RATE * (paidMs / 1000));
        for (const k of ["a", "arrowleft", "d", "arrowright"]) {
          const tap = tapState.get(k);
          if (tap && tap.start) tap.held += paidMs;   // ms, banked, so a release owes only the rest
        }
      }
    }
    let tapTurn = 0, tapWalk = 0;
    tapState.forEach((tap, k) => {
      if (tap.start) {
        // The key is down: the held path is answering it now, and the time it has had is time
        // the tap does not owe. A frame that saw the key for a thousandth of a second gave the
        // visitor a thousandth of a second of turn, and a tap that is owed a response has to be
        // paid the difference -- not suppressed by the fact that a frame looked at it.
        const isTurn = k === "a" || k === "arrowleft" || k === "d" || k === "arrowright";
        if (!isTurn) tap.held += elapsed * 1000;   // ms; a turn's frame share is paid above
        tap.ms = 0;
        return;
      }
      /* A tap that turns and a tap that walks are not the same size of gesture: a step should carry
         you somewhere, and a turn should be a nudge you can correct. A turn key is worth
         TURN_TAP_MS whatever the press lasted -- shorter presses are topped up to the nudge, longer
         ones have already been paid frame by frame above. (`held` is milliseconds, like `ms`: it
         used to be seconds against a millisecond value, so the subtraction was a no-op and every
         tap paid its full cap.) */
      const isTurn = k === "a" || k === "arrowleft" || k === "d" || k === "arrowright";
      /* The nudge is owed ONCE, on the frame that first sees the release (`tap.ms` is cleared below);
         without that guard the floor paid itself again on every later frame, and a tap of D measured
         8.9 degrees instead of 3.0. A press long enough to have been paid frame by frame owes the
         difference between its real length and what has already been paid, which is usually nothing. */
      const cap = isTurn ? (tap.ms > 0 ? Math.max(tap.ms, TURN_TAP_MS) : 0) : Math.min(tap.ms, 120);
      const owed = cap - tap.held;
      if (owed > 0) {
        const t = owed / 1000;
        if (k === "a" || k === "arrowleft") tapTurn -= t;
        else if (k === "d" || k === "arrowright") tapTurn += t;
        else if (k === "w" || k === "arrowup") tapWalk += t;
        else if (k === "s" || k === "arrowdown") tapWalk -= t;
      }
      tap.ms = 0; tap.held = 0;
    });
    if (tapTurn) yaw = wrapYaw(yaw + tapTurn * TURN_RATE);   // tapTurn is in seconds
    if (tapWalk) {
      const th = a(), sy = Math.sin(th), cy = Math.cos(th);
      moveBody(x + sy * SPEED * tapWalk, depth + cy * SPEED * tapWalk);
    }
    const steps = Math.max(1, Math.ceil(elapsed / 0.025));
    const step = elapsed / steps;
    const glideOnly = !!gliding;
    for (let i = 0; i < steps; i++) stepMotion(step, glideOnly);
    const speed = Math.hypot(vx, vd);
    if (!reduce() && speed > 4) {
      // At cruise this is a gentle ~1.7 Hz gait, under 6 mm of eye motion. There is no camera roll;
      // body motion is a cue, not a sway that competes with the view.
      phase += (speed / SPEED) * elapsed * Math.PI * 3.4;
      bob = Math.sin(phase) * 0.55 * Math.min(1, speed / SPEED);
    } else bob = 0;
    draw();
    checkReach();
    tutorFrame();
    // Keep asking for frames while anything is still moving — including a turn in place or a jump.
    // Held input keeps the pump alive at a wall; the idle pulse is for a genuinely resting walker.
    const hasWalkInput = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]
      .some((k) => keys.has(k)) || !!(stick && Math.hypot(stick.x, stick.y) > 0.04);
    pumping = speed > 4 || !!gliding || height > 0 || vy !== 0 || hasWalkInput;
    /* The tick's own cost, measured: `frameMs` is the gap between frames, `renderMs` is the
       Three.js pass, and this is everything the lane's own JavaScript costs -- the scene rebuild,
       the hit boxes, the reach. The gap minus this is the browser's own painting and the wait for
       the next frame, which is the part a visitor feels as lag when the picture cannot keep up. */
    tickMs = tickMs ? tickMs * 0.85 + (performance.now() - tickT0) * 0.15 : performance.now() - tickT0;
    if (pumping) loop();
    else startPulse();
  };
  // Asking for a real frame hands the pumping over to rAF, so the idle pulse is cancelled here rather
  // than at each call site: one owner for the two pumps, and never both at once.
  const loop = () => { stopPulse(); if (!raf) raf = requestAnimationFrame(tick); };

  /* An idle repaint, at eleven frames a second rather than sixty.

     The lamp cords and scene state continue to breathe when the walker stops. Rebuilding the authored
     surfaces for every idle tick is deliberately kept below the moving-frame rate; it stops when the
     page scrolls away or the plate is open, and `prefers-reduced-motion` turns it off at the source
     instead of cancelling motion after the render work has already been paid for. */
  let pulse = 0, inView = true;
  const stopPulse = () => { if (pulse) { clearTimeout(pulse); pulse = 0; } };
  const startPulse = () => {
    stopPulse();
    if (reduce() || !inView || (plate && plate.classList.contains("is-open"))) return;
    // The nudge calls the *tick*, and the tick decides what happens next — rAF if the body is moving,
    // another nudge if it is not. A bare repaint would look the same while standing still but would
    // strand a glide halfway down the lane, and a walker frozen between two frames is worse than a
    // lane that did not breathe.
    // A machine that needs a quarter of a second for one frame must not be asked for a full
    // repaint every 90 ms: the pulse would then own the whole budget and every press would queue
    // behind it. The idle breathe keeps its authored cadence when the frame is cheap and stands
    // down to twice the measured frame on a slow one — still breathing, never starving input.
    pulse = setTimeout(() => { pulse = 0; tick(performance.now()); }, Math.max(90, frameMs * 2));
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => {
      inView = es.some((e) => e.isIntersecting);
      if (inView) startPulse(); else stopPulse();
    }, { threshold: 0.01 }).observe(layer);
  }

  const jump = () => {
    // airborne, not merely high: standing on the overlook deck is a floor, not a fall
    if (height - floorAt(depth, x) > 0.5 || reduce() || MAX_HEIGHT <= 0) return;
    vy = JUMP;
    loop();
  };

  /* Round 75 -- a stop is a bookmark, and a bookmark that takes ninety seconds is not one.
     `GLIDE_SPEED` is 165 cm/s, which is comfortable for the two- to three-metre glide a photograph
     asks for and absurd for a station: clicking "Terrapin Point" (15599 cm down the Goat Island walk)
     started a 94-second crawl, and clicking any stop on a loaded machine could give up part way and
     leave the visitor short of the place the button named (measured, `.verify/_stops.mjs`: streets all
     arrived, Goat's first three were still walking after 30 s and stopped 26-40 m short).
     So the speed follows the jump: a move takes about `GLIDE_T`, never less than the comfort speed,
     never more than `GLIDE_SPEED_MAX`. It is constant for the length of one glide, so a long jump
     reads as one move rather than as an acceleration. `hard` glides (a stop, a frame) also finish on
     the target if the solver cancels them half way -- being short of a place the button named is the
     one outcome a bookmark must not have. */
  const glideTo = (z, targetX, hard = false) => {
    const to = clamp(z, MIN_D, MAX_D);
    const tx = clamp(targetX === undefined ? x : targetX, -halfAt(to), halfAt(to));
    const distance = Math.hypot(tx - x, to - depth);
    gliding = { to, x: tx, hard, startedAt: performance.now(),
                speed: clamp(distance / GLIDE_T, GLIDE_SPEED, GLIDE_SPEED_MAX) };
    vx = 0; vd = 0;
    loop();
  };
  const finishGlide = () => {
    if (!gliding) return;
    const { to, x: tx } = gliding;
    gliding = null;
    if (!collidesAt(tx, to)) moveBody(tx, to);
  };

  /* --- arriving, and the overlays that fold away ---
     There is no door to open any more: the page is the space, so boot only sets the first frame
     and says so once it has actually painted. Nothing here hides the site behind a modal or
     rewrites the URL — the list the visitor can read is part of this page, not a fallback
     stashed under it, and a space you have to be granted entry to is still a webpage. */
  const toggleList = (open) => {
    if (!listPanel) return;
    const wasOpen = !listPanel.classList.contains("is-closed");
    const want = open === undefined ? !wasOpen : !!open;
    listPanel.classList.toggle("is-closed", !want);
    if (want !== wasOpen) { if (want) overlayEntered(); else overlayLeft(); }
    if (listBtn) listBtn.setAttribute("aria-expanded", want ? "true" : "false");
    if (want) {
      const first = listPanel.querySelector("button, a");
      if (first) first.focus({ preventScroll: true });
    } else if (listBtn) {
      listBtn.focus({ preventScroll: true });
    }
  };
  /* Round 74 — the one text surface on the site, and the one kind of thing allowed to open it.
     Round 73 deleted `showCard` because every press opened it; the owner's refinement is 「只留該需要用
     文字彈出介面介紹的物件。其他…可以用E去互動看有沒有變化。你如果全部都做出彈出介面 這很傷使用者體驗。」
     A landmark is exactly that object: the falls are 370 m away, nothing about pressing them can move,
     and what the place has to say about them *is* the record. So `showWords` exists for `read` and for
     nothing else -- `act()` calls it from the landmark branch alone, and `.verify/verify-ux.mjs` fails
     the build if any other verb reaches a text surface. Everything else answers in the scene.
     The card is 30rem wide and holds 100-290 characters of record, which is a paragraph you read --
     not the 47 %-of-the-picture drawer the written lane opens to. */
  const showWords = (m) => {
    if (!card || !m) return;
    const where = card.querySelector("[data-walk-where]");
    const title = card.querySelector("[data-walk-title]");
    const hint = card.querySelector("[data-walk-hint]");
    const liveEl = card.querySelector("[data-walk-live]");
    if (where) where.textContent = `${district} · the record`;
    if (title) title.textContent = m.el.dataset.title || "";
    if (hint) hint.textContent = m.el.dataset.hint || "";
    if (liveEl) liveEl.textContent = "";
    card.dataset.mode = "words";
    if (asideEl) asideEl.hidden = true;
    const wasOpen = !card.hidden;
    card.hidden = false;
    if (!wasOpen) overlayEntered();
    if (infoBtn) infoBtn.setAttribute("aria-expanded", "true");
    const btn = card.querySelector("[data-walk-card-close]");
    if (btn) btn.focus({ preventScroll: true });
  };
  const boot = () => {
    // A texture that arrives after the first paint would otherwise stay black until the visitor
    // moves, so the frame it lands in is repainted on its own. Attached here, not where the images
    // are created: that code runs before `draw` exists, and a load handler that fires early enough
    // to matter is exactly the kind that reaches into an uninitialised binding.
    pics.forEach((img) => { img.onload = () => { if (!raf) draw(); }; });
    size();
    say("Building the lane…", "");
    draw();
    // Two frames, not a timer: the status reads ready once the transform has actually painted,
    // which is the same courtesy the reference pays with its "Level 1 ready."
    startPulse();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      say(`${district} ready · ${metres(MAX_D - depth)} of lane ahead`, "");
      markStops();
    }));
    loop();
  };
  const infoBtn = layer.querySelector("[data-walk-info]");
  const asideEl = card && card.querySelector("[data-walk-aside]");
  const hideCard = () => {
    if (!card) return;
    const wasOpen = !card.hidden;
    card.hidden = true;
    if (card.dataset.mode !== "prop") card.dataset.mode = "prop";
    if (asideEl) asideEl.hidden = true;
    if (infoBtn) infoBtn.setAttribute("aria-expanded", "false");
    if (wasOpen) overlayLeft();
  };
  /* Round 73: `showCard(m)` is gone. It was the window that opened over the picture with a prop's
     paragraph in it, and the owner has now ruled on it twice: 「你幫我全部拿掉這種」 and then
     「全部拿掉多餘的。你只要真的有意義的物件才留著」. A press either does something (goes through a
     door, shows a photograph, rides, plays, opens a shutter on a door you can use) or the thing was
     never a button -- the generator's `is_target` decides which. The paragraph is not lost: it is
     written in the lane's own list, which is where a landmark's press now opens it. */
  /* --- the guide: a first-visit strip that teaches the keys by having them used (round 46) ---
     The rule is that nothing is written over the space, and the guide honours it: it lives in the
     bottom chrome, takes no input away, grabs no focus, and never returns once learned. Each step
     waits for the real thing — a turn that actually turned, a stride that actually moved the body,
     a card that actually opened — so the hands learn the lane, not a dialog. The strip polls the
     committed state through the same getters `__walk` publishes (spatial-contracts §4: consume the
     solver, never re-implement it) — a guide measuring its own copy of the body could lie. */
  const tutorEl = layer.querySelector("[data-walk-tutor]");
  const tutorText = tutorEl && tutorEl.querySelector("[data-walk-tutor-text]");
  const tutorCount = tutorEl && tutorEl.querySelector("[data-walk-tutor-count]");
  const tutorSkip = tutorEl && tutorEl.querySelector("[data-walk-tutor-skip]");
  const tutorDoneBtn = tutorEl && tutorEl.querySelector("[data-walk-tutor-done]");
  const TUTOR_FLAG = "huaxu.walk-guide.v1";
  const tutStore = {
    done() { try { return window.localStorage.getItem(TUTOR_FLAG) === "1"; } catch (e) { return false; } },
    set() { try { window.localStorage.setItem(TUTOR_FLAG, "1"); } catch (e) { /* private mode: this visit only */ } },
  };
  const TUT = [
    "Turn first: the lane continues behind you. Arrow keys or A / D, or drag the view.",
    "Now walk in: hold W; Shift lets it run. The walls hold you — nothing here is a picture to walk through.",
    "Stand in front of something and press E, or press the bar that names it at the foot of the picture: a door takes you through, a picture shows you the reel, a machine plays. What everything else is, and why, is written in the list.",
    "Those ticks above are the rail. Press one and the lane carries you to where the view is worth stopping for; Esc walks you back out.",
  ];
  let tutStep = -1, tutYaw = 0, tutX = 0, tutD = 0;
  const showTutor = (i) => {
    if (!tutorEl) return;
    tutStep = i;
    if (i < 0) { tutorEl.hidden = true; return; }
    tutorEl.hidden = false;
    if (tutorText) tutorText.textContent = TUT[i];
    if (tutorCount) tutorCount.textContent = (i + 1) + " / " + TUT.length;
    if (tutorSkip) tutorSkip.hidden = i === TUT.length - 1;
    if (tutorDoneBtn) tutorDoneBtn.hidden = i !== TUT.length - 1;
    tutYaw = yaw; tutX = x; tutD = depth;
  };
  const endTutor = () => { tutStore.set(); showTutor(-1); };
  if (tutorSkip) tutorSkip.addEventListener("click", endTutor);
  if (tutorDoneBtn) tutorDoneBtn.addEventListener("click", endTutor);
  const tutorReplay = layer.querySelector("[data-walk-tutor-replay]");
  if (tutorReplay) tutorReplay.addEventListener("click", () => showTutor(0));
  const tutorFrame = () => {
    if (tutStep < 0) return;
    if (tutStep === 0 && Math.abs((((yaw - tutYaw) % 360) + 540) % 360 - 180) > 25) showTutor(1);
    else if (tutStep === 1 && Math.hypot(x - tutX, depth - tutD) > 180) showTutor(2);
  };
  // The third step completes when a press is *answered* -- round 73, that is a door, a reel, a toy or
  // a landmark's record, never a card for whatever the visitor happened to be facing.
  const tutorAnswered = () => { if (tutStep === 2) showTutor(3); };

  /* The space's own text — the legend, the disclaimer, the fallback sentence — is written into the
     page inside a card that is closed until you ask for it. Nothing in the head-up display is a
     sentence; the icons are the only chrome, and this is the one button that opens prose. */
  const showSpace = () => {
    if (!card) return;
    card.dataset.mode = "space";
    if (asideEl) asideEl.hidden = false;
    const where = card.querySelector("[data-walk-where]");
    const title = card.querySelector("[data-walk-title]");
    const hint = card.querySelector("[data-walk-hint]");
    const thing = reach ? (reach.el.dataset.title || "") : "";
    if (where) where.textContent = `${district} · one lane, drawn`;
    if (title) title.textContent = thing ? `${thing} · ${metres(reach.z - depth)} ahead`
                                          : "How to be in the lane";
    /* Round 75 -- the card is called "How to be in the lane", and what it said under that heading was
       a sentence about shopfronts: "the shutters carry no shop, the board is blank". That is true of
       the street and false of seven other lanes -- Goat Island has no shutters, and the fall a visitor
       is standing in front of is named. Every lane opens this card, so its copy has to be true in all
       of them: the keys first, then the principle, with no prop of any one place in the sentence. */
    if (hint) hint.textContent = thing
      ? "It is in front of you and it answers a press: E, or the bar at the foot of the picture. "
        + "Everything this lane draws, and what pressing it does, is written out in the list."
      : "W A S D to walk, arrow keys or A / D to turn, E for what is in front of you, L for everything "
        + "this lane draws, and Esc for the way out. Nothing is drawn with a name the record cannot "
        + "support: where a place is drawn rather than found, it is drawn blank.";
    if (liveEl) liveEl.textContent = statusEl ? statusEl.textContent : "";
    const wasOpen = !card.hidden;
    card.hidden = false;
    if (!wasOpen) overlayEntered();
    if (infoBtn) infoBtn.setAttribute("aria-expanded", "true");
    const btn = card.querySelector("[data-walk-card-close]");
    if (btn) btn.focus({ preventScroll: true });
  };
  if (infoBtn) infoBtn.addEventListener("click", () => {
    if (!card) return;
    if (card.hidden || card.dataset.mode !== "space") showSpace(); else hideCard();
  });

  const lampOf = new Map();
  lamps.forEach((L) => { if (L.of) lampOf.set(L.of, (lampOf.get(L.of) || []).concat([L])); });
  const setState = (m, i) => {
    m.st = i;
    m.el.dataset.state = String(i);
    m.el.setAttribute("aria-label", `${m.el.dataset.title}${m.states[i].say ? ` — ${m.states[i].say}` : ""}`);
    const g = m.states[i];
    (lampOf.get(m.kind) || []).forEach((L) => { L.k = L.k0 * (g.k === undefined ? 1 : g.k); });
  };

  const act = (m) => {
    if (!m) return;
    /* Round 73 puts the guard back at the top, and it is safe again because the *generator* now
       guarantees the invariant this file had to work around: `is_target` gives a press to anything
       with a verb (a door, a photograph, a ride, a game, a demonstration, a landmark, a door you use),
       so a thing can no longer be quiet and be a verb at once. Round 71 had the guard here and moved
       it down, because the goldfish stall was scenery by kind and a toy by behaviour; that case is
       decided in `is_target` now, which is the only place that knows what a thing does. */
    if (m.quiet) return;
    // The curtain at your back is the way out of the space and into the rest of the site, and the
    // record says so: `data-leave` is authored on the prop, so the renderer obeys rather than knowing
    // an id. Pressing it used to open a card that read "part it to leave the lane" and did nothing,
    // which is the worst kind of dead end — a control that describes an exit instead of being one.
    const leave = m.el.dataset.leave;
    if (leave) { window.location.assign(leave); return; }
    // A stall with a game plays before it explains: the owner asked for toys you press in the
    // environment itself, and a card that says "press to play" instead of playing is a dead end.
    if (m.el.dataset.ride && boardRide(m.el)) { tutorAnswered(); return; }
    if (m.el.dataset.game && window.huaxuStalls && window.huaxuStalls.open(m.el.dataset.game, m.el)) {
      tutorAnswered(); return;
    }
    // Pressed models demonstrate: the bridge replays its opening, the basin its ripple. The real
    // clock is never rewritten — the record's schedule (six openings, nothing after dark) keeps
    // running underneath, and the demonstration rides on top as a 24-second envelope. This is the
    // museum's own idiom: a demo button on a model does not move the thing it models.
    if (m.el.dataset.demo !== undefined) {
      m.el.__demoAt = performance.now();
      if (recordEl) {
        recordEl.dataset.demoHold = "1";
        recordEl.textContent = m.el.dataset.demo === "ripple"
          ? "A stone skipped across the model's basin: the rings widen and are gone."
          : m.el.dataset.demo === "wheel"
          ? "The wheel takes a courtesy turn: four seconds of the forty a real revolution needs, "
            + "then the 1.5 rpm settle. The gondolas are on the hour, all year; this model sells no tickets."
          : "The demonstration runs: the leaves rise, a boat takes the opening, the leaves fall.";
      }
      // the same redraw contract the hour button uses: the announcement gets one quiet moment
      // before the first pumped frame (the lane's own say() rewrites the record every tick), and
      // the pump keeps asking for frames until the envelope dies — a stopped clock draws nothing.
      // the envelope matches what the shape branch animates: a skip dies in three seconds and must
      // not hold the record line for the bridge's twenty-four
      const ENVELOPE = m.el.dataset.demo === "ripple" ? 4.5 : 24.5;
      const pump = () => {
        const t = (performance.now() - m.el.__demoAt) / 1000;
        if (t > ENVELOPE) {
          delete m.el.__demoAt;
          if (recordEl) { delete recordEl.dataset.demoHold; recordEl.textContent = ""; }
          return;
        }
        tick(performance.now());
        pulse = setTimeout(pump, 90);
      };
      if (pulse) clearTimeout(pulse);
      pulse = setTimeout(pump, 90);
      tutorAnswered();
      return;
    }
    if (m.el.dataset.story && openStoryRail(m.el.dataset.story, m.el)) { tutorAnswered(); return; }
    if (m.el.dataset.frame !== undefined && openDistrictRail(Number(m.el.dataset.frame), m.el)) {
      tutorAnswered(); return;
    }
    /* A thing with stops is *used*: a door opens, the glass floor comes on. Round 73 keeps only the
       two kinds whose state is what standing there is for (a door, the LookOut's glass floor); the
       seventeen shopfront and arcade toggles are the painting now. The sentence the state carries is
       announced on the record line instead of being painted into a card -- a screen reader gets it
       and a sighted visitor gets the door opening, which is the change itself. */
    if (m.states && m.states.length > 1) {
      setState(m, (m.st + 1) % m.states.length); draw();
      const said = m.states[m.st] && m.states[m.st].say;
      if (recordEl && said) { delete recordEl.dataset.demoHold; recordEl.textContent = said; }
      tutorAnswered();
      return;
    }
    /* The one record that is still worth a whole press: the thing the place is named for. It opens
       the written lane on its own row rather than a window over the picture (round 73). */
    /* The last verb, and the only one allowed to speak: the thing itself has nothing to show, so its
       record is the whole answer. Round 73 sent this to the written lane, which opened a drawer 47 %
       of the picture wide and scrolled a 100-row list to find one paragraph -- a heavier surface than
       the card it replaced, for the one object that *does* need to be read. */
    if (m.landmark) { showWords(m); tutorAnswered(); }
  };
  const nearestOf = (el) => meta.find((m) => m.el === el);
  /* Stand in front of a frame that has been opened. The lateral share used to be 0.45 of the frame's
     own x, which for a print hung at x −295 cm left the body 202 cm from it: one hand's reach is 190,
     so the thing you had just opened was out of reach of the next press -- you had to step in to open
     it again, and the bar at the foot of the picture disappeared the moment the reel closed. 0.58
     stands 1.7 m off the wall, inside the reach, which is also the distance a print on a shutter is
     read from. */
  const atFrame = (n) => {
    const m = meta.find((it) => it.el.dataset.frame === String(n));
    if (m) glideTo(m.z - 120, m.x * 0.58, true);   // stand in front of the thing you opened
  };

  /* --- input: every verb has both a key and a finger --- */
  const drawerClose = layer.querySelector("[data-walk-list-close]");
  if (drawerClose) drawerClose.addEventListener("click", () => toggleList(false));
  stops.forEach((el, i) => el.addEventListener("click", () => {
    if (stopView[i].yaw !== null) yaw = wrapYaw(stopView[i].yaw);
    if (stopView[i].pitch !== null) pitch = clamp(stopView[i].pitch, -MAX_PITCH, MAX_PITCH);
    // a stop authored on a deck you cannot walk onto arrives there outright (round 52: the
    // Fallsview overlook; its h is the record's, its stair is the incline)
    if (stopView[i].h !== null) {
      depth = stopZ[i]; x = clamp(stopX[i], -halfAt(stopZ[i]), halfAt(stopZ[i]));
      height = stopView[i].h; vy = 0; draw(); return;
    }
    glideTo(stopZ[i], stopX[i], true);   // a stop is a bookmark: it must arrive
  }));
  Array.from(layer.querySelectorAll("[data-walk-to]")).forEach((btn) => btn.addEventListener("click", () => {
    glideTo(parseFloat(btn.getAttribute("data-walk-to")) || 0);
    toggleList(false);
  }));
  if (listBtn) listBtn.addEventListener("click", () => toggleList());
  const jumpBtn = layer.querySelector("[data-walk-jump]");
  if (jumpBtn) jumpBtn.addEventListener("click", jump);
  Array.from(layer.querySelectorAll("[data-walk-fov]")).forEach((btn) => btn.addEventListener("click", () => {
    zoom = clamp(zoom + Number(btn.dataset.walkFov) * 0.08, 0.72, 1.34);
    draw();
  }));
  // The bar is only visible while something is in reach, so there is nothing to do if there is not:
  // a hidden control cannot be clicked, and `act` refuses an empty reach on its own.
  if (openBtn) openBtn.addEventListener("click", () => { if (reach) act(reach); });
  if (card) {
    const btn = card.querySelector("[data-walk-card-close]");
    if (btn) btn.addEventListener("click", () => { hideCard(); view.focus({ preventScroll: true }); });
  }
  /* A prop's button is still a button: Tab to it and press Enter, and it opens, which is the one
     route a keyboard-only visitor has to a record. A *pointer* click on it does not -- that is the
     visitor clicking the picture to focus the page or to look at something, and round 71 measured
     that every such click opened a card. `detail === 0` is the discriminator the DOM gives for a
     click synthesised by the keyboard (Enter/Space on a focused control) as against a real one. */
  objs.forEach((el) => el.addEventListener("click", (event) => {
    event.preventDefault();
    if (event.detail !== 0) { view.focus({ preventScroll: true }); return; }
    act(nearestOf(el));
  }));
  rows.forEach((row) => {
    const play = row.querySelector("[data-play]");
    if (play) play.addEventListener("click", () => openDistrictRail(Number(play.dataset.play), play));
  });

  view.addEventListener("pointerdown", (event) => {
    // Only the primary button turns the head — pointerdown fires for the right and middle buttons
    // too, and a scroll widget or a context menu arriving mid-swing is the difference between a
    // camera and a fight.
    if (event.button !== 0) return;
    /* A grab that starts on a wall thing is still a turn; only the *tap* is a press.
       Excluding the hit boxes here used to be the rule, and it made the camera unturnable from
       most of the screen: in a dressed room something stands at the centre more often than not,
       so the pointerdown was swallowed, no drag was ever created, and the pointerup found no tap
       either — the gesture did nothing at all, and the visitor concluded the space was a picture.
       The separation this was protecting lives one line down instead: a grab that travels is a
       look, one that does not is a press on whatever was under it. */
    down = { x: event.clientX, y: event.clientY, yaw, pitch, id: event.pointerId, moved: 0,
             // A quiet prop is scenery: the finger passes through it to whatever is behind, and a
             // tap on it opens whatever the visitor is actually facing.
             obj: event.target.closest(".walk-hit:not([data-quiet])") };
    wasDrag = false;
    view.classList.add("is-dragging");
    /* No capture when the grab started on a thing: with a capture target override the browser
       dispatches the follow-up `click` at the capturing element, and the thing's own button
       would never see the press it earned. */
    if (view.setPointerCapture && !down.obj) view.setPointerCapture(event.pointerId);
  });
  view.addEventListener("pointermove", (event) => {
    if (!down || event.pointerId !== down.id) return;
    const dx = event.clientX - down.x, dy = event.clientY - down.y;
    down.moved = Math.max(down.moved, Math.abs(dx) + Math.abs(dy));
    yaw = wrapYaw(down.yaw + dx * DRAG_DEG_PER_PX);     // turn through the room without Pointer Lock
    pitch = clamp(down.pitch - dy * 0.065, -MAX_PITCH, MAX_PITCH);
    gliding = null;
    /* A pointer reports at 60–240 Hz; this renderer draws one frame at a time and, on a software
       rasteriser, one frame is a quarter of a second. Drawing inside the event meant every one of
       those reports queued a full scene rebuild behind the GPU, so a drag arrived in the picture in
       bursts and the whole page stalled under it. The camera is set here and the frame is asked for
       once; the reach is checked in the tick, which is the frame that will show the new heading. */
    loop();
  });
  /* Releasing a grab has to hand the pumping back, or the lane dies the first time somebody looks
     around. `pointermove` paints directly and never asks for a frame, and the tick only schedules
     its own successor when the body is moving — so a drag that ended at rest left nothing asking
     for the next one, and the whole room froze on the frame the gesture happened to stop on.
     Measured: two frames a second and a half apart were byte-identical from every station after
     a turn, which is a screenshot wearing the clothes of a space. */
  const release = () => { down = null; view.classList.remove("is-dragging"); startPulse(); };
  /* A tap that never became a look is a press. `E` has a key and no finger, so on a phone every wall
     thing was pressable and none of them could be pressed — which is what "the interaction is off"
     reported. A tap with a card open closes it instead, because the same finger that opened something
     should be able to put it down. */
  const up = () => {
    const tap = !!down && down.moved < 8;
    release();
    wasDrag = !tap;
    if (!tap) return;
    /* Round 71, the owner's ruling: a tap does not open a card. It used to press whatever was in
       reach, wherever on the picture the finger landed, and the measurement was 25 taps out of 25
       on empty canvas opening a card -- so looking around kept interrupting the visitor with a
       window about a prop they had walked past. The finger still has one verb here, and it is the
       gentlest one: a tap puts down what is open. Everything else is a named control -- the reach
       bar (`[data-walk-open]`), a prop's own button, or E. */
    if (card && !card.hidden) { hideCard(); return; }
  };
  view.addEventListener("pointerup", up);
  view.addEventListener("pointercancel", release);
  /* A look that ended on the thing it started on is still a look, not a press: swallow the click a
     drag happens to leave behind, or turning the camera would also open whatever you grabbed. */
  view.addEventListener("click", (event) => {
    if (!wasDrag) return;
    wasDrag = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  // A menu opened over a drag would strand `is-dragging` on the layer and leave the cursor grabbing
  // forever, so the only right-click that is refused is the one that arrives while a turn is live.
  view.addEventListener("contextmenu", (event) => { if (down) event.preventDefault(); });
  view.addEventListener("auxclick", (event) => { if (event.button === 1) event.preventDefault(); });
  view.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoom = clamp(zoom + (event.deltaY > 0 ? 0.04 : -0.04), 0.72, 1.34);
    draw();
  }, { passive: false });

  if (pad) {
    const knob = pad.querySelector(".walk-knob");
    const set = (event) => {
      const box = pad.getBoundingClientRect();
      const r = box.width / 2 || 1;
      const nx = clamp((event.clientX - box.left - r) / r, -1, 1);
      const ny = clamp((event.clientY - box.top - r) / r, -1, 1);
      stick = { x: nx, y: ny };
      if (knob) knob.style.transform = `translate(${(nx * r * 0.55).toFixed(1)}px, ${(ny * r * 0.55).toFixed(1)}px)`;
    };
    pad.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;      // the stick answers a thumb and a left button, nothing else
      event.preventDefault();
      pad.setPointerCapture(event.pointerId);
      set(event);
      loop();
    });
    pad.addEventListener("pointermove", (event) => { if (stick) set(event); });
    const off = () => {
      stick = null;
      if (knob) knob.style.transform = "";
    };
    pad.addEventListener("pointerup", off);
    pad.addEventListener("pointercancel", off);
  }

  root.addEventListener("keydown", (event) => {
    if (plate && plate.classList.contains("is-open")) return;      // the rail owns its own keys
    const k = event.key.toLowerCase();
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    // The space is the thing being driven, so it takes keys — but only while nobody is reading or
    // holding a control: keys must not steal Space from a focused button (that is how a keyboard
    // user activates things), and the open drawer is a document to be read, not a HUD to walk in.
    const busy = (card && !card.hidden) || (listPanel && !listPanel.classList.contains("is-closed"));
    const onControl = document.activeElement && document.activeElement.closest(".walk-tools, .walk-stops, .walk-list, .walk-card");
    if (busy && k !== "escape" && k !== "l" && k !== "i") return;   // folding must survive folding: L
                                                          // closes what L opened and I closes what I
                                                          // opened, or a folded interface is a cage
    if (onControl && (k === " " || k === "enter" || k === "spacebar")) return;
    if (k === "escape") {
      // Esc unwinds one level and only then leaves: a card in front of you is closed, the written lane
      // is folded away, and with nothing left to unfold the key walks you out of the space. An immersive
      // view with no keyboard exit is a trap, and "there is a link somewhere in the corner" is a hint,
      // not an exit.
      event.preventDefault();
      if (card && !card.hidden) { hideCard(); return; }
      if (listPanel && !listPanel.classList.contains("is-closed")) { toggleList(false); return; }
      if (exitLink) window.location.assign(exitLink.getAttribute("href"));
      return;
    }
    if (k === "l") { event.preventDefault(); toggleList(); return; }
    // The note button's key. A folded interface still needs a keyboard route to the fold, or the
    // prose becomes something only a mouse can ask for.
    if (k === "i") {
      event.preventDefault();
      if (!card) return;
      if (card.hidden) {
        // The list is a document already being read; a note does not stack on top of it.
        if (listPanel && !listPanel.classList.contains("is-closed")) return;
        showSpace();
      } else if (card.dataset.mode === "space") hideCard();
      else showSpace();     // a prop's card is replaced by the lane's note, not buried under it
      return;
    }
    if (k === "e") {
      // E is the verb and only the verb. It used to double as the right-hand turn key, which made
      // "press E to open this" mean two different things depending on what else was held down; now
      // that A and D turn the head, E does one thing, and it does it.
      event.preventDefault(); act(reach); return;
    }
    if (k === " ") { event.preventDefault(); jump(); return; }
    if (k === "enter" && document.activeElement === view && reach) { event.preventDefault(); act(reach); return; }
    if (["w", "a", "s", "d", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      event.preventDefault();
      keys.add(k);
      // the press keeps its own clock, so a tap no frame saw still counts (see tapState)
      const tap = tapState.get(k) || { ms: 0, start: 0, held: 0 };
      if (!tap.start) tap.start = performance.now();
      tapState.set(k, tap);
      gliding = null;
      loop();
    }
  });
  root.addEventListener("keyup", (event) => {
    const k = event.key.toLowerCase();
    keys.delete(k);
    // the press is over: bank how long it lasted, so a tap no frame saw can still be paid out
    const tap = tapState.get(k);
    if (tap && tap.start) { tap.ms += performance.now() - tap.start; tap.start = 0; }
    /* Round 72: the nudge is paid inside a frame, so the release has to ask for one. On a slow
       machine the frame that saw the key down ends before the key comes up, and the lane then rests
       (it runs on a timer when nothing is held) -- so a 40 ms tap of the turn key measured 0.4 deg,
       the share that one frame happened to catch, and the other 3 degrees were owed to a frame that
       was never scheduled. `verify-feel` caught it; this line is the fix. */
    if (tap) loop();
  });
  const releaseInput = () => {
    keys.clear(); stick = null; vx = 0; vd = 0; gliding = null; last = 0;
    const knob = pad && pad.querySelector(".walk-knob");
    if (knob) knob.style.transform = "";
    if (down) { down = null; view.classList.remove("is-dragging"); wasDrag = false; }
  };
  // `blur` does not bubble to documentElement. Listen on the actual window so switching tabs or
  // applications cannot leave W/D held, and do the same when a mobile browser hides the page.
  window.addEventListener("blur", releaseInput);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") releaseInput();
  });
  // Desktop bonus, never a requirement: double-clicking the view locks the pointer the way the
  // three.js demo does; Esc releases it (the browser reserves that key while locked, so the
  // unwinding below never sees it). Phones keep dragging — the control they always had.
  view.addEventListener("dblclick", () => {
    if (document.pointerLockElement || typeof view.requestPointerLock !== "function") return;
    try { view.requestPointerLock(); } catch (err) { /* an embedded frame may refuse the lock; drag remains */ }
  });
  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== view) return;
    yaw = wrapYaw(yaw + (event.movementX || 0) * 0.14);
    pitch = clamp(pitch - (event.movementY || 0) * 0.10, -MAX_PITCH, MAX_PITCH);
    loop();
  });
  window.addEventListener("resize", () => { size(); draw(); });
  // Read-only, for the harness: a jsdom that can only assert "the picture changed" cannot tell a
  // camera that walks from one that jitters, and the numbers that matter are already in scope here.
  layer.__walk = { get depth() { return depth; }, get x() { return x; }, get height() { return height; },
                   get yaw() { return yaw; }, get pitch() { return pitch; }, get focal() { return focal; }, get quads() { return quads.length; },
                   /* Round 75: a glide is a promise the stop strip makes, and a measuring instrument
                      that guesses "arrived" from stillness guesses wrong on a loaded machine (the same
                      mistake `_aim.mjs` made until round 72). The state is exposed so a probe can ask
                      the lane whether it has finished rather than watch for it to sit still. */
                   get glide() { return gliding ? { z: gliding.to, x: gliding.x } : null; },
                   get drawQuads() { return quads; },
                   get wallHalf() { return WALL; }, get radius() { return PLAYER_RADIUS; },
                   get halfWidth() { return HALF; },
                   get minDepth() { return MIN_D; }, get maxDepth() { return MAX_D; },
                   get maxHeight() { return MAX_HEIGHT; }, get bob() { return bob; },
                   // the harness reads the real answer, not a re-implementation of it: the wall-gap
                   // gate calls this on positions a visitor could reach and requires no wall quad frees
                   get blockedAt() { return collidesAt; },
                   /* The solver's own numbers, read-only, for the harness: a body that has stopped
                      with the keys held is either against the world or against a mistake, and the
                      difference is visible here (the wish, the two axes, the contact). */
                   get solver() { return { x, depth, vx, vd, yaw,
                                          half: halfAt(depth), radius: PLAYER_RADIUS,
                                          contact: pushAt(x, depth) }; },
                   // the model's own velocity magnitude, cm/s — walk-feel reads this instead of
                   // dividing position deltas by wall-clock, which renderer clamps (0.12 s/frame)
                   // and swiftshader cadence (0.3-1.2 s/frame) distort in opposite directions
                   get velocity() { return Math.hypot(vx, vd); },
                   get maxSpeed() { return SPEED * RUN; }, get turnRate() { return TURN_RATE; },
                   get renderer() { return threeRenderer ? "three" : "off"; },
                   // the governor's own numbers, so a gate can assert motion and a report can say
                   // what the machine was actually asked to draw
                   get renderScale() { return renderScale; }, get frameMs() { return frameMs; },
                   get tickMs() { return tickMs; },
                   get renderMs() { return renderMs; },
                   get renderSize() { return [RW, RH]; }, get displaySize() { return [W, H]; },
                   // The no-WebGL path is the lane's own state, not the mounted module's: the mount
                   // reports the refusal here so one place decides what a renderer-less lane shows.
                   noteOffline,
                   get backdrop() { return bd; }, get day() { return DAY(); }, get dayPage() { return DAYPAGE; },
                   attachThree(engine) {
                     if (!engine || typeof engine.render !== "function") return false;
                     threeRenderer = engine; draw();
                     return threeRenderer === engine;
                   } };
  if (tutorEl && !tutStore.done()) showTutor(0);   // a first visit is taught in place, once
  /* The hour button: one icon in the chrome's tools row, sun by day and moon by night. The label
     states the choice it will make, the announcement goes to the live region the reader already
     listens to, and nothing about the toggle writes itself over the scene. */
  const hourBtn = layer.querySelector("[data-walk-hour]");
  if (hourBtn && !HELD) {
    const hourLabel = () => hourBtn.setAttribute("aria-label", hourPref === "night"
      ? "Night now. Switch this lane back to day." : "Daylight now. Bring on the night.");
    const setHour = () => {
      layer.dataset.walkClock = hourPref;
      hourBtn.classList.toggle("is-night", hourPref === "night");
      hourBtn.setAttribute("aria-pressed", hourPref === "night" ? "true" : "false");
      hourLabel();
      // the card's own nudge, for the same reason: a repaint that goes through the tick keeps a
      // gliding body gliding; a bare draw would strand it between frames.
      pulse = setTimeout(() => { pulse = 0; tick(performance.now()); }, 90);
    };
    hourBtn.addEventListener("click", () => {
      hourPref = hourPref === "day" ? "night" : "day";
      hourPhaseSet = hourPref === "night" ? HOUR_NIGHT : 0.5;
      try { window.localStorage.setItem(HOUR_KEY, hourPref); } catch (e) { /* this visit only */ }
      setHour();
      if (recordEl) recordEl.textContent = hourPref === "night"
        ? "Night comes: the lamps, the lit windows, and the falls' own colours."
        : "Daylight returns over the lane.";
    });
    layer.dataset.walkClock = hourPref;
    hourBtn.classList.toggle("is-night", hourPref === "night");
    hourBtn.setAttribute("aria-pressed", hourPref === "night" ? "true" : "false");
    hourLabel();
  }
  if (listPanel) listPanel.classList.add("is-closed");   // scripting present: fold it, then obey
  if (listBtn) listBtn.setAttribute("aria-expanded", "false");
  draw();
  boot();

  const railEl = plate && plate.querySelector("[data-story-reel]");
  let frames = railEl ? Array.from(railEl.querySelectorAll("[data-story-frame]")) : [];
  const setFrames = () => { frames = railEl ? Array.from(railEl.querySelectorAll("[data-story-frame]")) : []; };
  const segRow = plate && plate.querySelector("[data-story-segs]");
  const countEl = plate && plate.querySelector("[data-story-count]");
  const panel = plate && plate.querySelector(".modal-panel");
  let fi = 0, timer = null, paused = false, railOpener = null;
  /* One number, not two: the bar's fill duration and the advance timer are the same wait, and a drift
     between them is a progress bar that finishes before the frame does. If the custom property cannot be
     read, the authored 5s is the fallback rather than a guess at a different length. */
  const HOLD = ((parseFloat(getComputedStyle(panel || document.body)["--rail-hold"]) || 5) * 1000);
  if (railEl && frames.length && segRow) {
    frames.forEach(() => {
      const seg = document.createElement("span");
      seg.className = "story-seg";
      seg.appendChild(document.createElement("i"));
      segRow.appendChild(seg);
    });
  }
  const segs = segRow ? Array.from(segRow.children) : [];
  const headEl = plate && plate.querySelector("[data-room-title]");
  const whereEl = plate && plate.querySelector("[data-room-where]");
  const hintEl = plate && plate.querySelector("[data-room-hint]");
  /* Round 75b -- the reel's width. The record holds 1.83:1 landscapes (the falls, the street, the
     hall) and 0.75:1 portraits (Tokyo's prints, the scramble, the tower), so a fixed column
     letterboxes whichever shape it was not measured on: 9:16 gave a landscape 364 x 199 px inside a
     full screen, and a full-width column gives a portrait 406 px inside a full screen. The box is the
     picture: its ratio times the height the grid has left, capped by the panel's width. Measured here
     because CSS cannot do it without the layout arguing with itself (see css/site.css). */
  let frameAr = 9 / 16;
  const sizeReel = () => {
    if (!railEl || !panel) return;
    const cs = getComputedStyle(panel);
    const gap = parseFloat(cs.rowGap) || 0;
    /* Only the children that take part in the grid: the panel's chrome (the close button, the heading
       and the hint) is taken out of the flow and out of the picture's way, so counting them
       subtracts a band of height that nothing is using -- measured 969 px of picture where 992 fit. */
    const others = Array.from(panel.children)
      .filter((el) => el !== railEl && getComputedStyle(el).position !== "absolute");
    const chrome = others.reduce((a, el) => a + el.getBoundingClientRect().height, 0) + gap * others.length;
    const availH = panel.clientHeight - (parseFloat(cs.paddingTop) || 0)
      - (parseFloat(cs.paddingBottom) || 0) - chrome;
    const availW = panel.clientWidth - (parseFloat(cs.paddingLeft) || 0)
      - (parseFloat(cs.paddingRight) || 0);
    if (!(availH > 0) || !(availW > 0)) return;
    const w = Math.max(160, Math.min(availW, availH * frameAr));
    railEl.style.setProperty("--reel-w", `${Math.round(w)}px`);
  };
  window.addEventListener("resize", () => { if (plate && plate.classList.contains("is-rail")) sizeReel(); });

  const paint = () => {
    frames.forEach((f, j) => { f.hidden = j !== fi; });
    // The rail's heading follows the frame rather than the click, because the dialog is read as
    // a record: what it says has to be what is on screen at that moment.
    const cap = frames[fi] && frames[fi].querySelector("figcaption");
    if (cap) {
      const [t, h] = (cap.textContent || "").split(" — ");
      if (headEl) headEl.textContent = (t || "").trim();
      if (hintEl) hintEl.textContent = (h || "").trim();
      if (whereEl) whereEl.textContent = `${district} · frame ${fi + 1} of ${frames.length}`;
    }
    segs.forEach((sg, j) => {
      sg.classList.toggle("is-done", j < fi);
      sg.classList.toggle("is-now", j === fi);
    });
    /* Round 75: the plate's hint promises "next frame ... previous one" and the segments promise a
       sequence. A story of one frame has neither, so both are hidden rather than left telling a
       visitor to tap for something that does not exist. The reel that ships today is 3 or 6 frames,
       which is exactly why nobody would have noticed if a one-frame story were ever added. */
    if (segRow) segRow.hidden = frames.length < 2;
    if (countEl) countEl.hidden = frames.length < 2;
    const whenEl = plate && plate.querySelector(".modal-panel > .when");
    if (whenEl) whenEl.hidden = frames.length < 2;
    // The full-format ground is the frame's own pixels, so the screen behind the story changes with the
    // story; `url(...)` of an already-loaded file costs one decode and no bytes.
    if (panel) {
      const src = frames[fi] && frames[fi].querySelector("img");
      /* The value is absolute, made from the document's own base. A relative `url()` parked in a
         custom property is resolved where the property is *consumed* — `background-image:
         var(--fill)` sits in `css/site.css` — so every frame's ground was being asked for as
         `css/IMG/<file>.jpg`, 404, and the story played on an empty field instead of its own
         pixels. Resolving here is the one place that knows which document the file belongs to. */
      const raw = src && src.getAttribute("src");
      panel.style.setProperty("--fill", raw ? `url("${new URL(raw, document.baseURI).href}")` : "none");
      /* Round 75b: the reel's width is the picture's own ratio times the height the grid gives it
         (see `--ar` in css/site.css). One column cannot serve 1.83:1 landscapes and 0.75:1 portraits
         at once: whichever it is not measured on is letterboxed, and the surface then covers the
         screen to show a picture in a fifth of it. */
      if (src) {
        const setAr = () => {
          const w = src.naturalWidth, h = src.naturalHeight;
          frameAr = w && h ? w / h : 9 / 16;
          if (panel) panel.style.setProperty("--ar", w && h ? `${w} / ${h}` : "9 / 16");
          sizeReel();
        };
        setAr();
        /* Before the file decodes there is no ratio to read; the frame keeps the authored 9:16 for
           one paint and this fires on the decode, which is before it is ever shown. */
        if (!src.complete) src.addEventListener("load", setAr, { once: true });
      }
    }
    if (countEl) countEl.textContent = `${fi + 1} of ${frames.length}`;
  };
  const stopTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const schedule = () => {
    stopTimer();
    if (!ease || paused || frames.length < 2) return;
    timer = setTimeout(() => { fi = (fi + 1) % frames.length; paint(); schedule(); }, HOLD);
  };
  const openRail = (n, trigger, glide = true) => {
    if (!railEl || !frames.length) return false;
    fi = Math.max(0, Math.min(frames.length - 1, n));
    plate.classList.add("is-open", "is-rail");
    /* Standing in front of the frame while it plays is the point: the dialog is not a second place
       to look, it is the same wall at reading distance. A story rail glides nowhere: its frames are
       the prop's, not hung on this lane's walls. */
    if (glide) atFrame(n);
    paint();
    railOpener = enterOverlay(plate, ".modal-close", trigger);
    schedule();
    return true;
  };
  const enterBtn = plate ? plate.querySelector("[data-enter-space]") : null;
  const closeRail = () => {
    if (!plate || !plate.classList.contains("is-open")) return;
    stopTimer();
    paused = false;
    plate.classList.remove("is-open", "is-rail");
    if (enterBtn) enterBtn.hidden = true;
    leaveOverlay(plate, railOpener);
    railOpener = null;
  };
  /* The link contract (landmark-space §2): a landmark prop opens its own story first, and the
     enter-the-space verb sits beside the story in the plate chrome. The reel is rebuilt from the
     stories island, so one rail serves both the lane's hung frames and any prop's story. */
  const stories = readOne("[data-walk-stories]") || {};
  const homeReel = railEl ? railEl.innerHTML : "";
  const openStoryRail = (id, trigger) => {
    const st = stories[id];
    if (!st || !railEl || !st.frames || !st.frames.length) return false;
    railEl.innerHTML = st.frames.map((f, i) =>
      `<figure class="story-frame" data-story-frame="${i}"><img src="${f.src}" alt="${f.alt}">` +
      `<figcaption>${f.title} — ${f.caption}</figcaption></figure>`).join("");
    setFrames();
    if (enterBtn) { enterBtn.hidden = !st.space; if (st.space) enterBtn.href = st.space; }
    return openRail(0, trigger, false);
  };
  const openDistrictRail = (n, trigger) => {
    if (railEl && railEl.innerHTML !== homeReel) { railEl.innerHTML = homeReel; setFrames(); }
    if (enterBtn) enterBtn.hidden = true;
    return openRail(n, trigger);
  };
  if (panel && frames.length) {
    panel.addEventListener("pointerdown", (event) => {
      // A right or middle button is not a hold. The reel's own pan and the lane's turn are guarded the
      // same way: `pointerdown` fires for every button, and a gesture the owner did not mean turns into
      // a camera swing with a system menu on top of it.
      if (event.button !== 0 || event.target.closest("button")) return;
      paused = true;
      plate.classList.add("is-held");
      stopTimer();
    });
    panel.addEventListener("pointerup", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const box = panel.getBoundingClientRect();
      if (box.width) {
        const dx = event.clientX - box.left;
        if (dx > box.width * 0.66) fi = (fi + 1) % frames.length;
        else if (dx < box.width * 0.33) fi = (fi - 1 + frames.length) % frames.length;
        paint();
      }
      paused = false;
      plate.classList.remove("is-held");
      schedule();
    });
  }


  if (plate) {
    Array.from(plate.querySelectorAll("[data-room-close]")).forEach((el) => el.addEventListener("click", closeRail));
    plate.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();   // leaving the frame is not leaving the lane: the walk's own
        closeRail();               // Esc handler sits on an ancestor and must not also fire
      } else if (event.key === "Tab") {
        trapTab(plate, event);
      } else if (plate.classList.contains("is-rail") && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        event.preventDefault();
        fi = (fi + (event.key === "ArrowRight" ? 1 : -1) + frames.length) % frames.length;
        paint();
        schedule();
      } else if (plate.classList.contains("is-rail") && event.key === " ") {
        event.preventDefault();
        paused = !paused;
        plate.classList.toggle("is-held", paused);
        if (paused) stopTimer(); else schedule();
      }
    });
  }
  draw();
})();

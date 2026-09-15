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
    };
    const close = () => {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    document.querySelectorAll("[data-featured]").forEach((btn) => btn.addEventListener("click", () => open(btn)));
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  /* ---------- Activities: the photo plate ----------
     Selecting a tile of the contact sheet steps into the same photograph on a dark
     plate, with the rest of the roll on either side of it by swipe, arrow keys, or the
     arrows. Three absences are accounted for, because this page is read on a lecture-hall
     laptop, a phone, and sometimes with scripting off:
       - no document.startViewTransition -> the plate opens with no morph;
       - no scripting -> every tile is a plain link to the full-resolution file;
       - prefers-reduced-motion -> no morph, and the roll jumps rather than easing.
     Only one element may hold a given view-transition-name, so the name is put on the
     image being enlarged, on the box it is arriving from and the box it arrives in, and
     cleared once the transition settles. Entering the plate reuses the same overlay
     conventions as the trace game below. */
  const grid = document.querySelector("[data-ig-grid]");
  const plate = document.getElementById("ig-plate");

  /* The archive sheet leans toward the pointer: enough rotation to read as an object
     standing in a room, little enough that a caption is never tilted while being read.
     Touch is excluded (there is no hover to answer), and so is reduced motion. */
  const wall = document.querySelector("[data-ig-wall]");
  if (wall && grid && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let box = null;
    wall.addEventListener("pointerenter", () => { box = wall.getBoundingClientRect(); });
    wall.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      if (!box) box = wall.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      // Signs chosen against the CSS rotation matrices, not by eye: rotateY(+) turns a
      // surface normal toward +X, rotateX(+) toward -Y, so a positive angle on both makes
      // the sheet face the pointer. Swapping either reads as the sheet dodging the cursor.
      grid.style.setProperty("--ty", `${(x * 8).toFixed(2)}deg`);
      grid.style.setProperty("--tx", `${(-y * 6).toFixed(2)}deg`);
    });
    const level = () => {
      grid.style.setProperty("--ty", "0deg");
      grid.style.setProperty("--tx", "0deg");
    };
    wall.addEventListener("pointerleave", level);
  }
  if (grid && plate) {
    const tiles = Array.from(grid.querySelectorAll("[data-ig]"));
    const reel = plate.querySelector("[data-ig-reel]");
    const frames = reel ? Array.from(reel.children) : [];
    const count = plate.querySelector("[data-ig-count]");
    const prev = plate.querySelector("[data-ig-prev]");
    const next = plate.querySelector("[data-ig-next]");
    const many = frames.length > 1;
    const ease = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    let opener = null;                  // the tile to hand focus back to
    const named = [];

    const clamp = (i) => Math.max(0, Math.min(frames.length - 1, i));
    const at = () => clamp(Math.round(reel.scrollLeft / (reel.clientWidth || 1)));
    const name = (el) => {
      named.forEach((node) => { node.style.viewTransitionName = ""; });
      named.length = 0;
      if (el) {
        el.style.viewTransitionName = "ig-photo";
        named.push(el);
      }
    };
    /* Angles on the roll: the frame you are on faces you, its neighbours turn away and
       recede, so moving along the archive is turning along a wall rather than paging a
       carousel. Written on every scroll because a touch drag is not owned by the script;
       frames more than one and a half positions away are cleared instead of animated, so
       the cost is per-screenful, not per-archive. */
    const depth = ease;
    const setDepth = () => {
      if (!depth || !reel || !reel.clientWidth) return;
      const shown = reel.scrollLeft / reel.clientWidth;
      frames.forEach((frame, i) => {
        const d = i - shown;
        if (d < -1.6 || d > 1.6) {
          if (frame.style.transform) {
            frame.style.transform = "";
            frame.style.opacity = "";
          }
          return;
        }
        const off = Math.abs(d);
        frame.style.transform = `perspective(1100px) translateZ(${(-off * 150).toFixed(1)}px) rotateY(${(-d * 30).toFixed(1)}deg)`;
        frame.style.opacity = (1 - off * 0.42).toFixed(2);
      });
    };
    const paint = () => {
      const i = at();
      if (count) count.textContent = `${i + 1} / ${frames.length}`;
      if (prev) prev.disabled = !many || i === 0;
      if (next) next.disabled = !many || i === frames.length - 1;
      setDepth();
    };
    const glide = (i, behavior) => {
      const left = (reel.clientWidth || 0) * clamp(i);
      if (reel.scrollTo) reel.scrollTo({ left, behavior: behavior || (ease ? "smooth" : "auto") });
      else reel.scrollLeft = left;
      paint();
    };
    const morph = (apply) => {
      if (!ease || !document.startViewTransition) {
        apply();
        paint();
        name(null);        // nothing to hand to a transition, so leave no stray style
        return;
      }
      const done = () => { paint(); name(null); };
      document.startViewTransition(apply).finished.then(done, done);
    };

    tiles.forEach((tile, i) => {
      tile.addEventListener("click", (e) => {
        if (!frames[i]) return;         // never swallow the link without a plate to show
        e.preventDefault();
        name(tile.querySelector("img"));
        morph(() => {
          name(frames[i].querySelector("img"));
          plate.classList.add("is-open");
          opener = enterOverlay(plate, ".modal-close", tile);
          // "instant", not "auto": auto would inherit scroll-behavior:smooth and slide
          // the roll into place under the morph, which is the one motion we cannot afford.
          glide(i, "instant");
        });
      });
    });
    const close = () => {
      const i = at();
      name(frames[i] ? frames[i].querySelector("img") : null);
      morph(() => {
        name(opener ? opener.querySelector("img") : null);
        plate.classList.remove("is-open");
        leaveOverlay(plate, opener);
      });
    };
    Array.from(plate.querySelectorAll("[data-ig-close]")).forEach((el) => el.addEventListener("click", close));
    if (prev) prev.addEventListener("click", () => glide(at() - 1));
    if (next) next.addEventListener("click", () => glide(at() + 1));
    if (reel) {
      reel.addEventListener("scroll", paint, { passive: true });
      reel.addEventListener("scrollend", paint);   // a swipe that stopped short snaps back

      /* Drag the plate sideways. Touch already pans through the reel, so this only
         exists for a mouse: pulling the photograph by hand is what makes the roll read
         as an object rather than as a dialog with two buttons on it. Snapping is turned
         off for the duration, because mandatory snap fights a drag frame by frame. */
      let drag = null;
      reel.addEventListener("pointerdown", (event) => {
        if (!many || event.pointerType === "touch") return;
        drag = { x: event.clientX, left: reel.scrollLeft };
        reel.style.scrollSnapType = "none";
        if (reel.setPointerCapture) reel.setPointerCapture(event.pointerId);
      });
      reel.addEventListener("pointermove", (event) => {
        if (!drag) return;
        reel.scrollLeft = drag.left - (event.clientX - drag.x);
      });
      const settle = () => {
        if (!drag) return;
        drag = null;
        reel.style.scrollSnapType = "";
        glide(Math.round(reel.scrollLeft / (reel.clientWidth || 1)));
      };
      reel.addEventListener("pointerup", settle);
      reel.addEventListener("pointercancel", settle);
    }
    plate.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        trapTab(plate, e);
        return;
      }
      if (!many) return;
      const go = { ArrowLeft: at() - 1, ArrowRight: at() + 1, Home: 0, End: frames.length - 1 };
      if (go[e.key] === undefined) return;
      e.preventDefault();
      glide(go[e.key]);
    });
    paint();
  }

})();

/* ---- Shared overlay plumbing: one modal standard for the whole site ----
   inertOutside walks the overlay's ANCESTOR chain instead of sweeping
   document.body.children, because an overlay can sit inside <main> (the gallery
   photo plate is a body child; the dot game lives inside the page body). A
   body-level sweep of a nested overlay silently leaves the whole page exposed. */
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
  return restore;
}

function leaveOverlay(root, trigger) {
  inertOutside(root, false);
  document.body.style.overflow = "";
  if (trigger && typeof trigger.focus === "function") trigger.focus();
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
   The lane owns the viewport. That is the reference site's arrangement and it is the whole
   brief: entering a district has to read as standing in a place, not as looking at a figure set
   inside an article. Its level chips, its YOU marker, its `W A S D walk · Space jump · Drag to
   turn · E open` and its `Level 1 ready.` all float over a view that fills the screen, and every
   one of those verbs has a touch twin (`Jump` sits there as a button for exactly that reason).

   Deliberate limits, each one a trade rather than an oversight:
     - the eye does not move; the world is dragged the other way, so a corridor with one axis of
       travel needs no matrix math, no render library and no WebGL — and 0 KB of dependency;
     - yaw is free and pitch is clamped to ±35°, because past that the eye leaves the box and the
       visitor sees the ceiling edge instead of a lane;
     - turning is drag, never Pointer Lock: the reference does the same, and lock is unsupported on
       every iOS Safari, which would make the space unreachable on a phone;
     - 1 px = 1 cm, and the numbers are walking numbers: eye at 168, 235 cm/s at foot, 411 cm/s
       at a run, a 0.45 m jump under 2400 cm/s² of gravity;
     - the space is closed on six sides, so turning around shows the lane rather than its edge.
   What is not here: a lightmap, a physics engine, occlusion, or a claim that this is a survey.
   Frames are hung on the wall and are opened where you stand in front of them, which is the only
   reason the 3D exists at all — a picture you cannot walk up to does not need a corridor. */
(function () {
  const layer = document.querySelector("[data-walk]");
  if (!layer) return;
  const root = document.documentElement;
  const view = layer.querySelector("[data-walk-view]");
  const cv = layer.querySelector("[data-walk-canvas]");
  const g = cv && cv.getContext ? cv.getContext("2d") : null;
  const noRaster = layer.querySelector("[data-walk-fallback]");
  const statusEl = layer.querySelector("[data-walk-status]");
  const recordEl = layer.querySelector("[data-walk-record]");
  const card = layer.querySelector("[data-walk-card]");
  const listPanel = layer.querySelector("[data-walk-listpanel]");
  const listBtn = layer.querySelector("[data-walk-list]");
  const pad = layer.querySelector("[data-walk-pad]");
  const stops = Array.from(layer.querySelectorAll("[data-walk-stop]"));
  const objs = Array.from(layer.querySelectorAll("[data-obj]"));
  const plate = document.getElementById("room-plate");
  const rows = Array.from(document.querySelectorAll(".frame-row[data-row-obj]"));
  const district = layer.dataset.walk;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = !reduce();   // one test, shared by the walk's motion and the rail's hold-to-pause

  const HALF = 290, MIN_D = -30, MAX_D = 1200, REACH = 190, MAX_PITCH = 35;
  const SPEED = 235, RUN = 1.75, ACCEL = 11, GRAV = 2400, JUMP = 465;
  let on = true, zoom = 1, yaw = -4, pitch = -2, x = 0, depth = 60, height = 0, vy = 0;
  let vx = 0, vd = 0, phase = 0, bob = 0, roll = 0, raf = 0, last = 0, here = -1, reach = null;
  let gliding = null, keys = new Set(), stick = null, down = null;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const num = (el, prop) => parseFloat(el.style.getPropertyValue(prop)) || 0;
  const stopZ = stops.map((el) => num(el, "--z"));

  /* ---- the raster ----
     A canvas, one projection, a painter's algorithm. No WebGL, no library, nothing vendored: the
     whole viewport is 3D and it is still this repo's own code, so a browser that cannot run it gets
     the written district instead of a black rectangle. Walls are split into 60 cm panels because an
     affine map is exact across a panel that narrow, and each panel carries a *tiling* pattern rather
     than a photograph — nobody surveyed this alley, and a stretched stock texture would be the one
     lie a renderer like this tells easily. Fog, the amber pool and the bulbs are all distance
     functions of the same projection, so no depth cue can disagree with the geometry the way an
     overlaid gradient would. What this is not: a lightmap, a raytracer, or a survey. */
  const attr = (name, dflt) => parseFloat(layer.dataset[name]) || dflt;
  const WALL = attr("laneW", 640) / 2, CEIL = attr("laneCeil", 420);
  const Z_FAR = attr("laneD", 1247), Z_BACK = -attr("laneBack", 240);
  const EYE = attr("eye", 168);
  const SEG = 60, NEAR = 24, DPM = 2;   // panel, near plane, pattern scale: the renderer's own
  let W = 0, H = 0, focal = 620, tilePat = null, floorPat = null;
  const pics = new Map();
  const loadPics = () => {
    objs.forEach((el) => {
      const src = el.dataset.tex;
      if (!src || pics.has(src)) return;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      pics.set(src, img);
    });
  };
  const mkTile = (paint) => {
    const t = document.createElement("canvas");
    t.width = 128; t.height = 128;
    const c = t.getContext("2d");
    if (!c) return null;
    paint(c);
    return g.createPattern(t, "repeat");
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
  loadPics();
  const size = () => {
    if (!g) return;
    const cw = view.clientWidth || innerWidth, ch = view.clientHeight || innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.round(Math.min(1180, Math.max(320, cw * dpr)));
    H = Math.max(1, Math.round(W * (ch / Math.max(1, cw))));
    cv.width = W; cv.height = H;
    tilePat = mkTile(paintWall);
    floorPat = mkTile(paintFloor);
  };

  const meta = objs.map((el) => ({
    el, kind: el.dataset.obj, ry: num(el, "data-ry") || parseFloat(el.dataset.ry || 0),
    w: parseFloat(el.dataset.w) || 100, h: parseFloat(el.dataset.h) || 140,
    x: num(el, "--x"), z: num(el, "--z"), y: num(el, "--y"),
    pic: el.dataset.tex ? pics.get(el.dataset.tex) : null, sx: 0, sy: 0, sw: 0, sh: 0, shown: false,
  }));
  const cam = () => {
    const ry = (yaw * Math.PI) / 180, rp = ((pitch + (ease ? roll * 0.35 : 0)) * Math.PI) / 180;
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
    const [a0, b0] = uv[0], [a1, b1] = uv[1], [a2, b2] = uv[2];
    const x0 = W * 0.5 + (focal * p[0].x) / p[0].z, y0 = H * 0.5 + (focal * p[0].y) / p[0].z;
    const x1 = W * 0.5 + (focal * p[1].x) / p[1].z, y1 = H * 0.5 + (focal * p[1].y) / p[1].z;
    const x2 = W * 0.5 + (focal * p[2].x) / p[2].z, y2 = H * 0.5 + (focal * p[2].y) / p[2].z;
    const det = (a1 - a0) * (b2 - b0) - (a2 - a0) * (b1 - b0);
    if (Math.abs(det) < 1e-6) return null;
    const m11 = ((x1 - x0) * (b2 - b0) - (x2 - x0) * (b1 - b0)) / det;
    const m12 = ((x2 - x0) * (a1 - a0) - (x1 - x0) * (a2 - a0)) / det;
    const m21 = ((y1 - y0) * (b2 - b0) - (y2 - y0) * (b1 - b0)) / det;
    const m22 = ((y2 - y0) * (a1 - a0) - (y1 - y0) * (a2 - a0)) / det;
    return [m11, m21, m12, m22, x0 - m11 * a0 - m12 * b0, y0 - m21 * a0 - m22 * b0];
  };
  const PROP_TINT = { vending: "#f2a43c", noren: "#3d5c9a", shrine: "#8c4238",
                      utility: "#4c5a76", poster: "#33435f", frame: "#2c3a56" };
  const quads = [];
  const add = (C, corners, uv, mode, arg, img) => {
    const pts = corners.map((c, i) => {
      const o = camPt(C, c[0], c[1], c[2]);
      o.u = uv[i * 2]; o.v = uv[i * 2 + 1];
      return o;
    });
    const cp = clipNear(pts);
    if (cp.length < 3) return null;
    let off = 0;
    cp.forEach((q) => {
      const sx = W * 0.5 + (focal * q.x) / q.z, sy = H * 0.5 + (focal * q.y) / q.z;
      if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80) off += 1;
    });
    if (!off) return null;
    let z = 0; cp.forEach((q) => { z += q.z; });
    const quad = { z: z / cp.length, pts: cp, mode, arg, img };
    quads.push(quad);
    return quad;
  };
  const box = (C, q) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    q.pts.forEach((p) => {
      const sx = W * 0.5 + (focal * p.x) / p.z, sy = H * 0.5 + (focal * p.y) / p.z;
      x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
    });
    return [x0, y0, x1 - x0, y1 - y0];
  };
  /* Lighting, in the order a night actually works: the level the eye has adapted to, then a
     distance-squared falloff from each source, then the air in between. The sources are the same
     list the bulbs and the machine's glow are drawn from, so no wall can be bright where nothing is
     shining at it. The first pass here had one lamp and a murk ceiling of 0.94, which is exactly why
     it read as a black rectangle: an eye never adapts to 6% of a material. */
  // Two exposures, chosen by the operating system rather than by a widget in my corner: a screen
  // that is dim, or an eye that needs more contrast, is the visitor's own setting to change.
  const boost = matchMedia("(prefers-contrast: more)").matches;
  const AMBIENT = boost ? 0.6 : 0.42;   // what the lane looks like with every bulb gone
  const FOG_MAX = boost ? 0.4 : 0.6;    // how much air may stand between you and the far wall
  const lamp = meta.find((m) => m.kind === "vending") || meta[0] || { x: 0, y: 0, z: 0, h: 150 };
  const lamps = [];
  for (let z = 40; z < Z_FAR; z += 200) {
    lamps.push({ x: 0, y: CEIL - 34, z, r: 30, tint: "rgba(255,216,158,0.42)", k: 0.5, wet: true });
  }
  lamps.push({ x: lamp.x, y: (lamp.y || 0) + lamp.h * 0.62, z: lamp.z, r: 130,
               tint: "rgba(255,192,104,0.5)", k: 1.05, wet: false });
  const lightAt = (px, py, pz) => {
    let v = AMBIENT;
    for (let i = 0; i < lamps.length; i++) {
      const L = lamps[i];
      const d2 = (px - L.x) * (px - L.x) + (pz - L.z) * (pz - L.z) + (py - L.y) * (py - L.y) * 0.4;
      v += L.k / (1 + d2 / 44000);            // half-light at 210 cm: a bulb, not a searchlight
    }
    return Math.min(1.7, v);
  };
  const haze = (z) => clamp((z - 420) / 2450, 0, 1) * FOG_MAX;

  const emit = (q) => {
    const path = () => {
      g.beginPath();
      q.pts.forEach((p, i) => {
        const sx = W * 0.5 + (focal * p.x) / p.z, sy = H * 0.5 + (focal * p.y) / p.z;
        if (i) g.lineTo(sx, sy); else g.moveTo(sx, sy);
      });
      g.closePath();
    };
    path();
    if (q.mode === "flat") g.fillStyle = q.arg; else g.fillStyle = "#2b3a56";
    g.fill();
    if (q.mode === "pat" && q.arg) {
      const m = affine(q.pts, q.pts.map((p) => [p.u, p.v]));
      if (m) {
        g.save(); path(); g.clip(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        g.fillStyle = q.arg; g.fillRect(-2048, -2048, 4096, 4096); g.restore();
      }
    } else if (q.mode === "pic" && q.img && q.img.complete && q.img.naturalWidth) {
      const m = affine(q.pts, q.pts.map((p) => [p.u, p.v]));
      if (m) {
        g.save(); path(); g.clip(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        g.drawImage(q.img, 0, 0, q.img.naturalWidth, q.img.naturalHeight); g.restore();
      }
    }
    // Warm where a source reaches, then the air. The murk is navy rather than black on purpose:
    // distance should look like something you are seeing through, not like the picture ending.
    const warm = clamp((q.lit || 0) - 0.55, 0, 1.15);
    if (warm > 0.02) { path(); g.fillStyle = `rgba(255,228,186,${(warm * 0.24).toFixed(3)})`; g.fill(); }
    const dark = q.air === undefined ? haze(q.z) : q.air;
    if (dark > 0.01) { path(); g.fillStyle = `rgba(22,34,60,${dark.toFixed(3)})`; g.fill(); }
  };

  const draw = () => {
    if (!g) return;
    // Recomputed per frame, not per resize: − / + are a field-of-view control, so the projection
    // has to answer them, and only the surface it is drawn on belongs to the device.
    const half = clamp(0.6 / zoom, 0.34, 0.92);
    focal = W * 0.5 / Math.tan(half);
    const C = cam();
    quads.length = 0;
    for (let z = Z_BACK; z < Z_FAR; z += SEG) {
      const z1 = Math.min(z + SEG, Z_FAR);
      const zc = (z + z1) / 2;
      [-1, 1].forEach((side) => {
        const px = side * WALL;
        const q = add(C, [[px, 0, z], [px, 0, z1], [px, CEIL, z1], [px, CEIL, z]],
                      [z * DPM, 0, z1 * DPM, 0, z1 * DPM, -CEIL * DPM, z * DPM, -CEIL * DPM],
                      "pat", tilePat);
        if (q) q.lit = lightAt(px, 210, zc);
      });
      const fl = add(C, [[-WALL, 0, z], [WALL, 0, z], [WALL, 0, z1], [-WALL, 0, z1]],
          [z * DPM, -WALL * DPM, z * DPM, WALL * DPM, z1 * DPM, WALL * DPM, z1 * DPM, -WALL * DPM],
          "pat", floorPat);
      if (fl) { fl.lit = lightAt(0, 6, zc) * 1.15; fl.air = haze(fl.z) * 0.7; }
      const cl = add(C, [[-WALL, CEIL, z], [WALL, CEIL, z], [WALL, CEIL, z1], [-WALL, CEIL, z1]],
          [0, 0, 0, 0, 0, 0, 0, 0], "flat", "#232f4a");
      if (cl) cl.lit = AMBIENT * 0.8;   // out of the bulbs' reach, and it should look that way
    }
    const far = add(C, [[-WALL, 0, Z_FAR], [WALL, 0, Z_FAR], [WALL, CEIL, Z_FAR], [-WALL, CEIL, Z_FAR]],
        [0, 0, WALL * DPM * 2, 0, WALL * DPM * 2, -CEIL * DPM * 2, 0, -CEIL * DPM * 2], "pat", tilePat);
    if (far) far.lit = lightAt(0, 210, Z_FAR);
    const back = add(C, [[WALL, 0, Z_BACK], [-WALL, 0, Z_BACK], [-WALL, CEIL, Z_BACK], [WALL, CEIL, Z_BACK]],
        [0, 0, 0, 0, 0, 0, 0, 0], "flat", "#2a3854");
    if (back) back.lit = lightAt(0, 210, Z_BACK);

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
      const q = add(C, corners, uv.flat(), face, PROP_TINT[m.kind] || "#33435f", m.pic);
      m.shown = false;
      if (!q) { m.el.style.visibility = "hidden"; m.el.tabIndex = -1; return; }
      q.lit = m.kind === "vending" ? 1.7 : lit;
      // A hung frame is the one thing in an alley that is lit on purpose: it keeps its own contrast
      // instead of fogging into the wall behind it, or nobody would read the photograph.
      if (m.pic) { q.air = haze(q.z) * 0.4; q.lit = Math.max(lit, 0.72); }
      const b = box(C, q);
      if (b[2] > 6 && b[3] > 6 && b[0] > -40 && b[0] < W + 40 && b[1] < H + 40 && b[1] > -40) {
        m.el.style.visibility = "visible";
        m.el.tabIndex = 0;
        m.el.style.transform = `translate3d(${b[0].toFixed(1)}px, ${b[1].toFixed(1)}px, 0)`;
        m.el.style.width = `${Math.max(8, b[2]).toFixed(1)}px`;
        m.el.style.height = `${Math.max(8, b[3]).toFixed(1)}px`;
        m.shown = true;
      } else {
        m.el.style.visibility = "hidden";
        m.el.tabIndex = -1;
      }
    });

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#141e36";
    g.fillRect(0, 0, W, H);
    g.setTransform(1, 0, 0, 1, 0, 0);
    quads.sort((p, q) => q.z - p.z);
    quads.forEach(emit);

    // The bulbs and the machine are glows, not geometry: same projection, drawn afterwards, so the
    // amber pool cannot disagree with where the machine actually is.
    g.globalCompositeOperation = "lighter";
    const glow = (px, py, pz, r, col) => {
      const p = camPt(C, px, py, pz);
      if (p.z < NEAR) return;
      const sx = W * 0.5 + (focal * p.x) / p.z, sy = H * 0.5 + (focal * p.y) / p.z;
      const rad = Math.max(6, (focal * r) / p.z);
      if (sx < -rad || sx > W + rad || sy < -rad || sy > H + rad) return;
      const grd = g.createRadialGradient(sx, sy, 0, sx, sy, rad);
      grd.addColorStop(0, col);
      grd.addColorStop(1, "rgba(242,164,60,0)");
      g.fillStyle = grd;
      g.beginPath(); g.arc(sx, sy, rad, 0, 6.2832); g.fill();
    };
    const reflect = (px, pz, r) => {
      const p = camPt(C, px, 4, pz);
      if (p.z < NEAR) return;
      const sx = W * 0.5 + (focal * p.x) / p.z, sy = H * 0.5 + (focal * p.y) / p.z;
      const rad = Math.max(8, (focal * r) / p.z);
      g.save();
      g.translate(sx, sy);
      g.scale(1, 0.3);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, rad);
      rg.addColorStop(0, "rgba(255,214,158,0.15)");
      rg.addColorStop(1, "rgba(255,214,158,0)");
      g.fillStyle = rg;
      g.beginPath(); g.arc(0, 0, rad, 0, 6.2832); g.fill();
      g.restore();
    };

    lamps.forEach((L) => {
      glow(L.x, L.y, L.z, L.r, L.tint);
      if (L.wet) reflect(L.x, L.z, L.r * 3.6);     // each bulb's pool, thrown back by the asphalt
    });
    g.globalCompositeOperation = "source-over";

    // where your body actually is, on the floor: the one thing that makes a first-person view
    // legible as a body rather than a camera
    const sh = camPt(C, x, 2, depth + 40);
    if (sh.z > NEAR) {
      const sx = W * 0.5 + (focal * sh.x) / sh.z, sy = H * 0.5 + (focal * sh.y) / sh.z;
      g.fillStyle = "rgba(3,6,14,0.5)";
      g.beginPath();
      g.ellipse(sx, sy, Math.max(4, focal * 26 / sh.z), Math.max(2, focal * 9 / sh.z), 0, 0, 6.2832);
      g.fill();
    }
  };

  const say = (status, record) => {
    if (status && statusEl) statusEl.textContent = status;
    if (record !== undefined && recordEl) recordEl.textContent = record;
  };
  const metres = (v) => `${(Math.abs(v) / 100).toFixed(1)} m`;

  const markStops = () => {
    let best = -1, far = Infinity;
    stopZ.forEach((z, i) => {
      const d = Math.abs(z - depth);
      if (d < far) { far = d; best = i; }
    });
    if (best === here) return;
    here = best;
    stops.forEach((el, i) => el.classList.toggle("is-here", i === here));
    if (here >= 0 && far < 240) say(`${labels[here]} · ${metres(depth)} in`, "");
  };
  const labels = stops.map((el) => (el.textContent || "").trim());

  /* The reach: what you can open is decided by where you stand and where you look, so the scene
     answers before anything is pressed, and `E` is never a guess. */
  const a = () => (yaw * Math.PI) / 180;
  const checkReach = () => {
    const fx = Math.sin(a()), fd = Math.cos(a());
    let best = null, bestD = REACH;
    meta.forEach((m) => {
      const dx = m.x - x, dd = m.z - depth;
      const dist = Math.hypot(dx, dd);
      if (dist > bestD) return;
      const facing = dist < 4 ? 1 : (dx * fx + dd * fd) / dist;
      if (facing < 0.35) return;
      best = m; bestD = dist;
    });
    if (best && best.el === (reach && reach.el)) { reach = best; return; }
    if (reach) reach.el.classList.remove("is-reach");
    reach = best;
    if (!best) { markStops(); return; }
    best.el.classList.add("is-reach");
    const title = best.el.dataset.title || "";
    say(`${title} · ${metres(best.z - depth)} ahead`,
        best.el.dataset.frame === undefined ? "Press E to look closer." : "Press E to open the frame.");
  };

  const tick = (t) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
    last = t;
    if (gliding) {
      const to = gliding.to;
      const step = (to - depth) * Math.min(1, dt * 6.5);
      depth += step;
      x += (gliding.x - x) * Math.min(1, dt * 6.5);
      if (Math.abs(to - depth) < 1.2) { depth = to; x = gliding.x; gliding = null; }
    } else {
      let mx = stick ? stick.x : 0, md = stick ? -stick.y : 0;
      if (keys.has("w") || keys.has("arrowup")) md += 1;
      if (keys.has("s") || keys.has("arrowdown")) md -= 1;
      if (keys.has("a")) mx -= 1;
      if (keys.has("d")) mx += 1;
      const len = Math.hypot(mx, md) || 1;
      const r = keys.has("shift") ? RUN : 1;
      const ang = a();
      const wishX = ((Math.sin(ang) * md + Math.cos(ang) * mx) / len) * SPEED * r;
      const wishD = ((Math.cos(ang) * md - Math.sin(ang) * mx) / len) * SPEED * r;
      const k = 1 - Math.exp(-ACCEL * dt);
      vx += (wishX - vx) * k;
      vd += (wishD - vd) * k;
      x = clamp(x + vx * dt, -HALF, HALF);
      depth = clamp(depth + vd * dt, MIN_D, MAX_D);
      if (x === -HALF || x === HALF) vx = 0;
      if (depth === MIN_D || depth === MAX_D) vd = 0;
    }
    if (height > 0 || vy !== 0) {
      vy -= GRAV * dt;
      height = Math.max(0, height + vy * dt);
      if (height === 0) vy = 0;
    }
    const speed = Math.hypot(vx, vd);
    if (!reduce()) {
      phase += (speed / 46) * dt * 6;
      const amp = Math.min(1, speed / SPEED);
      bob = Math.sin(phase) * 2.1 * amp;
      roll = Math.sin(phase * 0.5) * 0.34 * amp;
    } else { bob = 0; roll = 0; }
    draw();
    checkReach();
    // Keep asking for frames while anything is still moving — including straight up, because a
    // jump with no horizontal speed would otherwise freeze in mid-air.
    if (on && (speed > 4 || gliding || height > 0 || vy !== 0)) loop();
  };
  const loop = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const jump = () => {
    if (height > 0.5 || reduce()) return;
    vy = JUMP;
    loop();
  };

  const glideTo = (z, targetX) => {
    gliding = { to: clamp(z, MIN_D, MAX_D), x: targetX === undefined ? x : targetX };
    vx = 0; vd = 0;
    loop();
  };

  /* --- arriving, and the overlays that fold away ---
     There is no door to open any more: the page is the space, so boot only sets the first frame
     and says so once it has actually painted. Nothing here hides the site behind a modal or
     rewrites the URL — the list the visitor can read is part of this page, not a fallback
     stashed under it, and a space you have to be granted entry to is still a webpage. */
  const toggleList = (open) => {
    if (!listPanel) return;
    const want = open === undefined ? listPanel.classList.contains("is-closed") : !!open;
    listPanel.classList.toggle("is-closed", !want);
    if (listBtn) listBtn.setAttribute("aria-expanded", want ? "true" : "false");
    if (want) {
      const first = listPanel.querySelector("button, a");
      if (first) first.focus({ preventScroll: true });
    } else if (listBtn) {
      listBtn.focus({ preventScroll: true });
    }
  };
  const boot = () => {
    // A texture that arrives after the first paint would otherwise stay black until the visitor
    // moves, so the frame it lands in is repainted on its own. Attached here, not where the images
    // are created: that code runs before `draw` exists, and a load handler that fires early enough
    // to matter is exactly the kind that reaches into an uninitialised binding.
    pics.forEach((img) => { img.onload = () => { if (on && !raf) draw(); }; });
    if (!g) {
      // The reference names its fallback instead of hiding it: a visitor with no canvas gets the
      // sentence and the list, not a black rectangle that looks like a broken image.
      if (noRaster) noRaster.hidden = false;
      say("Rendering the lane is unavailable here · the list below still reads", "");
      if (listBtn) toggleList(true);
      return;
    }
    size();
    say("Building the lane…", "");
    draw();
    // Two frames, not a timer: the status reads ready once the transform has actually painted,
    // which is the same courtesy the reference pays with its "Level 1 ready."
    requestAnimationFrame(() => requestAnimationFrame(() => {
      say(`${district} ready · ${metres(MAX_D - depth)} of lane ahead`, "");
      markStops();
    }));
    loop();
  };
  const fold = () => {
    on = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0; keys.clear(); stick = null; gliding = null;
    if (plate && plate.classList.contains("is-open")) closeRail();
    hideCard();
    toggleList(false);
  };

  const hideCard = () => {
    if (!card) return;
    card.hidden = true;
  };
  const showCard = (m) => {
    if (!card) return;
    const where = card.querySelector("[data-walk-where]");
    const title = card.querySelector("[data-walk-title]");
    const hint = card.querySelector("[data-walk-hint]");
    if (where) where.textContent = `${district} · ${metres(m.z)} in`;
    if (title) title.textContent = m.el.dataset.title || "";
    if (hint) hint.textContent = m.el.dataset.hint || "";
    card.hidden = false;
    const btn = card.querySelector("[data-walk-card-close]");
    if (btn) btn.focus({ preventScroll: true });
  };

  const act = (m) => {
    if (!m) return;
    // The curtain at your back is the way out of the space and into the CV. It is a real link in
    // the data, not a decorative prop, so it navigates rather than closing a dialog.
    if (m.el.classList.contains("room-noren")) { window.location.assign("index.html"); return; }
    if (m.el.dataset.frame !== undefined && openRail(Number(m.el.dataset.frame), m.el)) return;
    if (m.el.dataset.obj === "vending" && openRail(0, m.el)) return;
    showCard(m);
  };
  const nearestOf = (el) => meta.find((m) => m.el === el);
  const atFrame = (n) => {
    const m = meta.find((it) => it.el.dataset.frame === String(n));
    if (m) glideTo(m.z - 120, m.x * 0.45);
  };

  /* --- input: every verb has both a key and a finger --- */
  const drawerClose = layer.querySelector("[data-walk-list-close]");
  if (drawerClose) drawerClose.addEventListener("click", () => toggleList(false));
  stops.forEach((el, i) => el.addEventListener("click", () => { glideTo(stopZ[i]); }));
  Array.from(layer.querySelectorAll("[data-walk-to]")).forEach((btn) => btn.addEventListener("click", () => {
    glideTo(parseFloat(btn.getAttribute("data-walk-to")) || 0);
    toggleList(false);
  }));
  if (listBtn) listBtn.addEventListener("click", () => toggleList());
  const jumpBtn = layer.querySelector("[data-walk-jump]");
  if (jumpBtn) jumpBtn.addEventListener("click", jump);
  Array.from(layer.querySelectorAll("[data-walk-fov]")).forEach((btn) => btn.addEventListener("click", () => {
    zoom = clamp(zoom + Number(btn.dataset.walkFov) * 0.12, 0.72, 1.34);
    draw();
  }));
  if (card) {
    const btn = card.querySelector("[data-walk-card-close]");
    if (btn) btn.addEventListener("click", () => { hideCard(); view.focus({ preventScroll: true }); });
  }
  objs.forEach((el) => el.addEventListener("click", (event) => {
    event.preventDefault();
    act(nearestOf(el));
  }));
  rows.forEach((row) => {
    const play = row.querySelector("[data-play]");
    if (play) play.addEventListener("click", () => openRail(Number(play.dataset.play), play));
  });

  view.addEventListener("pointerdown", (event) => {
    // A grab that starts on a wall thing is a press on a control, not a turn: the two gestures have
    // to stay separable, or tapping the vending machine would swing the camera.
    if (event.target.closest(".walk-hit")) return;
    down = { x: event.clientX, y: event.clientY, yaw, pitch, id: event.pointerId, moved: 0 };
    view.classList.add("is-dragging");
    if (view.setPointerCapture) view.setPointerCapture(event.pointerId);
  });
  view.addEventListener("pointermove", (event) => {
    if (!down || event.pointerId !== down.id) return;
    const dx = event.clientX - down.x, dy = event.clientY - down.y;
    down.moved = Math.max(down.moved, Math.abs(dx) + Math.abs(dy));
    yaw = down.yaw + dx * 0.14;                       // yaw is free: the box is closed behind you
    pitch = clamp(down.pitch - dy * 0.1, -MAX_PITCH, MAX_PITCH);
    gliding = null;
    draw();
    checkReach();
  });
  const up = () => { down = null; view.classList.remove("is-dragging"); };
  view.addEventListener("pointerup", up);
  view.addEventListener("pointercancel", up);
  view.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoom = clamp(zoom + (event.deltaY > 0 ? 0.08 : -0.08), 0.72, 1.34);
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
    if (!on) return;
    if (plate && plate.classList.contains("is-open")) return;      // the rail owns its own keys
    const k = event.key.toLowerCase();
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    // The space is the thing being driven, so it takes keys — but only while nobody is reading or
    // holding a control: keys must not steal Space from a focused button (that is how a keyboard
    // user activates things), and the open drawer is a document to be read, not a HUD to walk in.
    const busy = (card && !card.hidden) || (listPanel && !listPanel.classList.contains("is-closed"));
    const onControl = document.activeElement && document.activeElement.closest(".walk-tools, .walk-stops, .walk-list, .walk-card");
    if (busy && k !== "escape" && k !== "l") return;   // folding must survive folding: L closes what
                                                          // L opened, or the drawer becomes a cage
    if (onControl && (k === " " || k === "enter" || k === "spacebar")) return;
    if (k === "escape") {
      // Esc folds the overlays away and never ejects anybody: the page is the space, so there is
      // nothing underneath to fall back to. The link in the corner is the way out.
      event.preventDefault();
      if (card && !card.hidden) hideCard();
      else if (listPanel && !listPanel.classList.contains("is-closed")) toggleList(false);
      return;
    }
    if (k === "l") { event.preventDefault(); toggleList(); return; }
    if (k === "e") { event.preventDefault(); act(reach); return; }
    if (k === " ") { event.preventDefault(); jump(); return; }
    if (k === "enter" && document.activeElement === view && reach) { event.preventDefault(); act(reach); return; }
    if (["w", "a", "s", "d", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      event.preventDefault();
      if (k === "arrowleft") yaw -= 7;
      else if (k === "arrowright") yaw += 7;
      else keys.add(k);
      gliding = null;
      loop();
    }
  });
  root.addEventListener("keyup", (event) => { keys.delete(event.key.toLowerCase()); });
  root.addEventListener("blur", () => { keys.clear(); stick = null; });
  window.addEventListener("resize", () => { if (on) { size(); draw(); } });
  // Read-only, for the harness: a jsdom that can only assert "the picture changed" cannot tell a
  // camera that walks from one that jitters, and the numbers that matter are already in scope here.
  layer.__walk = { get depth() { return depth; }, get x() { return x; }, get height() { return height; },
                   get yaw() { return yaw; }, get focal() { return focal; }, get quads() { return quads.length; } };
  if (listPanel) listPanel.classList.add("is-closed");   // scripting present: fold it, then obey
  if (listBtn) listBtn.setAttribute("aria-expanded", "false");
  draw();
  boot();

  const railEl = plate && plate.querySelector("[data-story-reel]");
  const frames = railEl ? Array.from(railEl.querySelectorAll("[data-story-frame]")) : [];
  const segRow = plate && plate.querySelector("[data-story-segs]");
  const countEl = plate && plate.querySelector("[data-story-count]");
  const panel = plate && plate.querySelector(".modal-panel");
  let fi = 0, timer = null, paused = false, railOpener = null;
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
      if (sg.firstChild) sg.firstChild.style.width = j < fi ? "100%" : "0";
    });
    if (countEl) countEl.textContent = `${fi + 1} of ${frames.length}`;
  };
  const stopTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const schedule = () => {
    stopTimer();
    if (!ease || paused || frames.length < 2) return;
    timer = setTimeout(() => { fi = (fi + 1) % frames.length; paint(); schedule(); }, 5000);
  };
  const openRail = (n, trigger) => {
    if (!railEl || !frames.length) return false;
    fi = Math.max(0, Math.min(frames.length - 1, n));
    plate.classList.add("is-open", "is-rail");
    /* Standing in front of the frame while it plays is the point: the dialog is not a second place
       to look, it is the same wall at reading distance. */
    atFrame(n);
    paint();
    railOpener = enterOverlay(plate, ".modal-close", trigger);
    schedule();
    return true;
  };
  const closeRail = () => {
    if (!plate || !plate.classList.contains("is-open")) return;
    stopTimer();
    paused = false;
    plate.classList.remove("is-open", "is-rail");
    leaveOverlay(plate, railOpener);
    railOpener = null;
  };
  if (panel && frames.length) {
    panel.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      paused = true;
      stopTimer();
    });
    panel.addEventListener("pointerup", (event) => {
      if (event.target.closest("button")) return;
      const box = panel.getBoundingClientRect();
      if (box.width) {
        const dx = event.clientX - box.left;
        if (dx > box.width * 0.66) fi = (fi + 1) % frames.length;
        else if (dx < box.width * 0.33) fi = (fi - 1 + frames.length) % frames.length;
        paint();
      }
      paused = false;
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
        if (paused) stopTimer(); else schedule();
      }
    });
  }
  draw();
})();

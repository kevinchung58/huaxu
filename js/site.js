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
  /* One roll per page, however many blocks hang tiles. The plate is addressed by index, so the
     tiles are flattened across every grid in the order they appear and the frames are emitted in
     that same order; a per-block roll would mean a per-block plate, and then "the album" would
     quietly mean "whichever block you happened to open first". */
  const grids = Array.from(document.querySelectorAll("[data-ig-grid]"));
  const plate = document.getElementById("ig-plate");

  /* The archive sheet leans toward the pointer: enough rotation to read as an object
     standing in a room, little enough that a caption is never tilted while being read.
     Touch is excluded (there is no hover to answer), and so is reduced motion. */
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    grids.forEach((grid) => {
      const wall = grid.closest("[data-ig-wall]") || grid.parentElement;
      if (!wall) return;
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
    });
  }
  if (grids.length && plate) {
    const tiles = grids.flatMap((grid) => Array.from(grid.querySelectorAll("[data-ig]")));
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
        if (!many || event.pointerType === "touch" || event.button !== 0) return;
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
  // The chrome's way out and the curtain's destination are the same link, read once: the key, the finger
  // and the record must not be able to disagree about where leaving goes.
  const exitLink = layer.querySelector("[data-walk-exit]");
  const plate = document.getElementById("room-plate");
  const rows = Array.from(document.querySelectorAll(".frame-row[data-row-obj]"));
  const district = layer.dataset.walk;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = !reduce();   // one test, shared by the walk's motion and the rail's hold-to-pause

  const HALF = 290, MIN_D = -30, MAX_D = 1200, REACH = 190, MAX_PITCH = 35;
  // The smallest thing a hand can be asked to press. A lantern 30 m down the lane projects to a few
  // pixels of wall, and a wall of a few pixels is not a control; the ring stays on the silhouette and
  // only the press area grows, so the lane keeps its drawing while the finger keeps its target.
  const HIT = 44;
  const SPEED = 235, RUN = 1.75, ACCEL = 11, GRAV = 2400, JUMP = 465;
  let zoom = 1, yaw = -4, pitch = -2, x = 0, depth = 60, height = 0, vy = 0;
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
  let W = 0, H = 0, focal = 620, tilePat = null, floorPat = null, winPat = null;
  // One lookup for every cladding the walls and the ground can be wearing; a kind with no entry falls
  // back to the wall's own tiles, which is the honest default for a surface nobody specified.
  const PATS = {};
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
  const size = () => {
    if (!g) return;
    const cw = view.clientWidth || innerWidth, ch = view.clientHeight || innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.round(Math.min(1180, Math.max(320, cw * dpr)));
    H = Math.max(1, Math.round(W * (ch / Math.max(1, cw))));
    cv.width = W; cv.height = H;
    tilePat = mkTile(paintWall);
    floorPat = mkTile(paintFloor);
    winPat = mkTile(paintWindows);
    PATS.shutter = mkTile(paintShutter);
    PATS.dado = mkTile(paintDado);
    PATS.brick = mkTile(paintBrick);
    PATS.corrugated = mkTile(paintCorrugated);
    PATS.hoarding = mkTile(paintHoarding);
    PATS.plaster = tilePat;
    PATS.tactile = mkTile(paintTactile);
    PATS.kerb = mkTile(paintKerb);
    PATS.grate = mkTile(paintGrate);
    PATS.lantern = mkTile(paintLantern);
  };

  const readIsland = (sel) => {
    const node = layer.querySelector(sel);
    if (!node) return [];
    try { return JSON.parse(node.textContent) || []; } catch (err) { return []; }
  };
  const meta = objs.map((el) => ({
    el, kind: el.dataset.obj, ry: num(el, "data-ry") || parseFloat(el.dataset.ry || 0),
    w: parseFloat(el.dataset.w) || 100, h: parseFloat(el.dataset.h) || 140,
    d: parseFloat(el.dataset.d) || 12, x: num(el, "--x"), z: num(el, "--z"), y: num(el, "--y"),
    pic: el.dataset.tex ? pics.get(el.dataset.tex) : null, sx: 0, sy: 0, sw: 0, sh: 0, shown: false,
    // A prop with `data-states` can be done to; the count of stops is authored, and the index lives
    // here rather than in the scene graph so that the card, the light and the picture read one value.
    states: (() => {
      if (!el.dataset.states) return null;
      try { return JSON.parse(el.dataset.states); } catch (e) { return null; }
    })(), st: 0,
  }));
  const wires = readIsland("[data-walk-wires]");
  const beams = readIsland("[data-walk-beams]");
  const vista = (readIsland("[data-walk-vista]")[0]) || null;
  const bd = (readIsland("[data-walk-backdrop]")[0]) || null;
  const surfaces = readIsland("[data-walk-surfaces]");
  const marks = readIsland("[data-walk-marks]");
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
                      utility: "#4c5a76", poster: "#33435f", frame: "#2c3a56",
                      ac: "#6d7a90", crate: "#7a6248", bin: "#3f5a4a", bollard: "#8a8676",
                      steps: "#565f74", pipe: "#5c6a80", awning: "#8a3f3a", sign: "#2b3a56",
                      drain: "#111a2c", booth: "#8b9ab0", bikes: "#39435a", planter: "#6e5540",
                      cones: "#c96a34", mailbox: "#9c3b33", signA: "#c8c2b2", banner: "#8f3a3a",
                      front: "#2c3a56", ledge: "#6b7890", pane: "#6f7d92", window: "#6f7d92" };
  // How far a kind is a solid. A picture on a wall is a plane and must not be given a thickness it
  // cannot have; everything else in a lane has three visible faces or it is a decal, not an object.
  const SHAPE = { vending: "box", shrine: "box", utility: "box", ac: "box", crate: "box",
                  booth: "glass", bikes: "bikes", planter: "planter", cones: "cones",
                  mailbox: "flap", signA: "aboard", banner: "cloth", front: "front", pane: "pane",
                  bin: "box", bollard: "box", steps: "box", pipe: "box", awning: "box",
                  sign: "box", drain: "plate", noren: "cloth", poster: "plane", frame: "plane" };
  const mix = (hex, k) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const to = k >= 0 ? [255, 238, 208] : [10, 17, 40];
    const a = Math.abs(k);
    return `rgb(${c.map((v, i) => Math.round(v + (to[i] - v) * a)).join(",")})`;
  };
  const ZERO8 = [0, 0, 0, 0, 0, 0, 0, 0];
  const quads = [];
  const add = (C, corners, uv, mode, arg, img, big) => {
    const pts = corners.map((c, i) => {
      const o = camPt(C, c[0], c[1], c[2]);
      o.u = uv[i * 2]; o.v = uv[i * 2 + 1];
      return o;
    });
    const cp = clipNear(pts);
    if (cp.length < 3) return null;
    let off = 0, bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    cp.forEach((q) => {
      const sx = W * 0.5 + (focal * q.x) / q.z, sy = H * 0.5 + (focal * q.y) / q.z;
      bx0 = Math.min(bx0, sx); bx1 = Math.max(bx1, sx);
      by0 = Math.min(by0, sy); by1 = Math.max(by1, sy);
      if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80) off += 1;
    });
    /* A far plane must not be culled by its corners: the sky covers the view by being larger than
       it, so every corner lands off-screen and the whole backdrop would disappear. Big quads are
       tested against their bounds instead, and they stay in the same list, so the depth sort still
       puts them behind the room rather than under a fixed overlay. */
    if (!off && !(big && bx1 > 0 && bx0 < W && by1 > 0 && by0 < H)) return null;
    let z = 0; cp.forEach((q) => { z += q.z; });
    const quad = { z: z / cp.length, pts: cp, mode, arg, img };
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
    wet: L.bulb !== false,
    // Sources with something hanging from the wire: a bulb is a dot of light, a lantern is a body you
    // can walk under. Which lights have a body is decided by the district, not by the renderer.
    body: L.body || null, size: L.size || 0, h: L.h || 0,
    of: L.of || null, k0: L.k === undefined ? 0.5 : L.k,
    swing: L.swing || 0, period: L.period || 4, phase: L.phase || 0,
  }));
  // Time, sampled once per frame: a lantern that swings on a clock of its own while everything else
  // uses another is how a scene starts to shimmer.
  let T = 0;
  const swayOf = (L) => (!L.swing || reduce() ? 0 : Math.sin(T * 6.28319 / L.period + L.phase) * L.swing);
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
    /* A textured quad is one fill, not two.

       Every tile in this lane is painted opaque — the wall's own, the asphalt, the shutters — so the
       flat colour that used to go down first was invisible work, and the pattern used to be filled
       over 4096² units and clipped back, which costs the same whether the quad is a 60 cm panel or a
       speck. The uv extent of the quad covers it exactly, and if the affine fit fails the flat colour
       is still what you see. */
    let fitted = false;
    if (q.mode === "pat" && q.arg) {
      const m = affine(q.pts, q.pts.map((p) => [p.u, p.v]));
      if (m) {
        const us = q.pts.map((p) => p.u), vs = q.pts.map((p) => p.v);
        const u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us);
        const v0 = Math.min.apply(null, vs), v1 = Math.max.apply(null, vs);
        g.save(); path(); g.clip(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        g.fillStyle = q.arg;
        g.fillRect(u0 - 1, v0 - 1, u1 - u0 + 2, v1 - v0 + 2);
        g.restore();
        fitted = true;
      }
    }
    if (!fitted) { g.fillStyle = q.mode === "flat" ? q.arg : "#2b3a56"; g.fill(); }
    if (!fitted && q.mode === "pic" && q.img && q.img.complete && q.img.naturalWidth) {
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
          if (q) { q.lit = lightAt(cx, 2, cz); q.air = haze(q.z) * 0.7; }
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
          if (q) { q.lit = lightAt(px, 3, (za + zb) / 2) * 1.18; q.air = haze(q.z) * 0.7; }
        }
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
          q.air = haze(q.z) * 0.7;
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
    const band = (b) => {
      const q = add(C, [[-150000, b.y0, 120000], [150000, b.y0, 120000],
                        [150000, b.y1, 120000], [-150000, b.y1, 120000]],
                    ZERO8, "flat", b.c, null, true);
      if (q) { q.air = 0; q.lit = b.glow || 0; }
    };
    (bd.sky || []).forEach(band);
    const mt = bd.mountain;
    if (mt) {
      const q = add(C, [[mt.x - mt.half, mt.base, mt.z], [mt.x + mt.half, mt.base, mt.z],
                        [mt.x + mt.crown, mt.top, mt.z], [mt.x - mt.crown, mt.top, mt.z]],
                    ZERO8, "flat", "#2e3d5c", null, true);
      if (q) { q.air = 0.12; q.lit = 0.3; }
      const line = mt.top - (mt.top - mt.base) * mt.snow;
      const cap = add(C, [[mt.x - mt.crown, mt.top, mt.z], [mt.x + mt.crown, mt.top, mt.z],
                          [mt.x + mt.crown * 1.9, line, mt.z], [mt.x - mt.crown * 1.9, line, mt.z]],
                      ZERO8, "flat", "#c9d8f2", null, true);
      if (cap) { cap.air = 0.14; cap.lit = 0.5; }
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
                      ZERO8, "flat", i % 2 ? "#c9613a" : "#e8e2d4", null, true);
        if (q) { q.air = 0.1; q.lit = 0.62; }
      }
      const mast = add(C, [[tw.x - 18, tw.top, tw.z], [tw.x + 18, tw.top, tw.z],
                           [tw.x + 6, tw.mast, tw.z], [tw.x - 6, tw.mast, tw.z]],
                       ZERO8, "flat", "#d8d2c4", null, true);
      if (mast) mast.air = 0.1;
      (tw.decks || []).forEach((dy) => {
        const w = taper(dy) * 1.5;
        const deck = add(C, [[tw.x - w, dy, tw.z], [tw.x + w, dy, tw.z],
                             [tw.x + w, dy + 90, tw.z], [tw.x - w, dy + 90, tw.z]],
                         ZERO8, "flat", "#f0d9a8", null, true);
        if (deck) { deck.air = 0.06; deck.lit = 0.9; }
      });
    }
    const plaza = bd.plaza;
    if (plaza) {
      const fl = add(C, [[-plaza.half, plaza.y, plaza.z0], [plaza.half, plaza.y, plaza.z0],
                          [plaza.half, plaza.y, plaza.z1], [-plaza.half, plaza.y, plaza.z1]],
          [plaza.z0 * DPM, -plaza.half * DPM, plaza.z0 * DPM, plaza.half * DPM,
           plaza.z1 * DPM, plaza.half * DPM, plaza.z1 * DPM, -plaza.half * DPM],
          "pat", floorPat, null, true);
      if (fl) { fl.air = 0.22; fl.lit = 0.5; }
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
                      ZERO8, "flat", "#c7d3e8", null, true);
        if (q) { q.air = 0.18; q.lit = 0.72; }
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
                        ZERO8, "flat", "#b9c7de", null, true);
          if (q) { q.air = 0.2; q.lit = 0.62; }
        }
      }
    }
    (bd.city || []).forEach((b) => {
      const hw = b.w / 2, k = 0.5 + (b.win || 0.4);
      const face = add(C, [[b.x - hw, 0, b.z], [b.x + hw, 0, b.z], [b.x + hw, b.h, b.z],
                           [b.x - hw, b.h, b.z]],
          [(b.x - hw) * k, 0, (b.x + hw) * k, 0, (b.x + hw) * k, -b.h * k, (b.x - hw) * k, -b.h * k],
          "pat", winPat, null, true);
      if (face) { face.air = 0.14; face.lit = 0.46; }
      const side = b.x < 0 ? 1 : -1;
      const sf = add(C, [[b.x + side * hw, 0, b.z - hw], [b.x + side * hw, 0, b.z + hw],
                          [b.x + side * hw, b.h, b.z + hw], [b.x + side * hw, b.h, b.z - hw]],
          [(b.z - hw) * k, 0, (b.z + hw) * k, 0, (b.z + hw) * k, -b.h * k, (b.z - hw) * k, -b.h * k],
          "pat", winPat, null, true);
      if (sf) { sf.air = 0.14; sf.lit = 0.3; }
      const lip = add(C, [[b.x - hw, b.h, b.z], [b.x + hw, b.h, b.z], [b.x + hw, b.h, b.z - 40],
                          [b.x - hw, b.h, b.z - 40]], ZERO8, "flat", "#0f1727", null, true);
      if (lip) lip.air = 0.1;
    });
  };

  const draw = () => {
    T = (window.performance && performance.now ? performance.now() : Date.now()) / 1000;
    if (!g) return;
    // Recomputed per frame, not per resize: − / + are a field-of-view control, so the projection
    // has to answer them, and only the surface it is drawn on belongs to the device.
    const half = clamp(0.6 / zoom, 0.34, 0.92);
    focal = W * 0.5 / Math.tan(half);
    const C = cam();
    quads.length = 0;
    // Whether the authored bands tile a panel's whole height: if they do, the wall's own tiling is
    // not painted at all, because the cladding will be. Anything less than full coverage keeps it, so
    // a half-dressed wall shows plaster behind the shutter rather than the void.
    const cladCovers = (side, z0, z1) => {
      const rows = surfaces.filter((sc) => sc.side === side && sc.z0 < z1 && sc.z1 > z0).sort((a, b) => a.y0 - b.y0);
      let y = 0;
      for (const r of rows) {
        if (r.y0 > y + 0.01) break;
        if (r.y1 > y) y = r.y1;
        if (y >= CEIL) return true;
      }
      return y >= CEIL;
    };
    for (let z = Z_BACK; z < Z_FAR; z += SEG) {
      const z1 = Math.min(z + SEG, Z_FAR);
      const zc = (z + z1) / 2;
      [-1, 1].forEach((side) => {
        if (surfaces.length && cladCovers(side, z, z1)) return;
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
    const wallPiece = (x0, y0, x1, y1, at) => {
      const q = add(C, [[x0, y0, Z_FAR], [x1, y0, Z_FAR], [x1, y1, Z_FAR], [x0, y1, Z_FAR]],
          [x0 * DPM, -y0 * DPM, x1 * DPM, -y0 * DPM, x1 * DPM, -y1 * DPM, x0 * DPM, -y1 * DPM],
          "pat", tilePat);
      if (q) q.lit = at;
      return q;
    };
    if (vista) {
      // Four pieces around the opening, plus jambs and a sill: a hole in a wall has a reveal, and
      // without one the vista reads as a decal of a window rather than a route out of the room.
      const vx0 = Math.max(-WALL, vista.x - vista.w / 2), vx1 = Math.min(WALL, vista.x + vista.w / 2);
      wallPiece(-WALL, 0, WALL, vista.y0, lightAt(0, 40, Z_FAR));
      wallPiece(-WALL, vista.y1, WALL, CEIL, lightAt(0, 380, Z_FAR));
      wallPiece(-WALL, vista.y0, vx0, vista.y1, lightAt(-300, 210, Z_FAR));
      wallPiece(vx1, vista.y0, WALL, vista.y1, lightAt(300, 210, Z_FAR));
      const deep = 26;
      [vx0, vx1].forEach((ex) => {
        const q = add(C, [[ex, vista.y0, Z_FAR], [ex, vista.y0, Z_FAR - deep],
                          [ex, vista.y1, Z_FAR - deep], [ex, vista.y1, Z_FAR]],
                      ZERO8, "flat", mix("#465572", -0.16));
        if (q) q.lit = lightAt(ex * 0.6, 210, Z_FAR) * 1.2;
      });
      const sill = add(C, [[vx0, vista.y0, Z_FAR], [vx1, vista.y0, Z_FAR],
                           [vx1, vista.y0, Z_FAR - deep], [vx0, vista.y0, Z_FAR - deep]],
                       ZERO8, "flat", mix("#5a6a88", 0.1));
      if (sill) sill.lit = lightAt(0, 120, Z_FAR) * 1.3;
    } else {
      wallPiece(-WALL, 0, WALL, CEIL, lightAt(0, 210, Z_FAR));
    }
    /* Cladding, panel by panel.

       A band of shutter is drawn as the same 60 cm slices as the wall behind it, because an affine
       texture map is only exact across a panel that narrow — a single stretched quad over four metres
       of corrugated sheet would bend the ribs where the wall bends them differently, and that
       mismatch is exactly what makes a scene read as a decal. Two centimetres off the wall keeps the
       depth sort deciding in the cladding's favour without a visible offset, so there is no z-fight
       and nothing to polygon-offset. */
    surfaces.forEach((sc) => {
      const px = sc.side * (WALL - 2);
      const from = Math.max(sc.z0, Z_BACK), to = Math.min(sc.z1, Z_FAR);
      const pat = PATS[sc.kind] || tilePat;
      for (let z = Math.floor(from / SEG) * SEG; z < to; z += SEG) {
        const z0 = Math.max(z, from), z1 = Math.min(z + SEG, to);
        if (z1 - z0 < 1) continue;
        const q = add(C, [[px, sc.y0, z0], [px, sc.y0, z1], [px, sc.y1, z1], [px, sc.y1, z0]],
            [z0 * DPM, -sc.y0 * DPM, z1 * DPM, -sc.y0 * DPM, z1 * DPM, -sc.y1 * DPM, z0 * DPM, -sc.y1 * DPM],
            "pat", pat);
        if (q) {
          // `tone` is authored dirt: a band can be brighter or duller than the material it is cut from,
          // which is what a wall that has been patched and repainted once actually looks like.
          q.lit = lightAt(px, (sc.y0 + sc.y1) / 2, (z0 + z1) / 2)
                  * (sc.kind === "shutter" ? 1.12 : 1) * (sc.tone === undefined ? 1 : sc.tone);
          // A shutter is metal and catches the light; plywood and brick mostly do not.
          if (sc.kind === "hoarding") q.lit *= 0.86;
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
        if (q) { q.lit = 1.5; q.air = haze(q.z) * 0.5; }
      });
    });
    if (bd) drawFar(C);
    const back = add(C, [[WALL, 0, Z_BACK], [-WALL, 0, Z_BACK], [-WALL, CEIL, Z_BACK], [WALL, CEIL, Z_BACK]],
        [0, 0, 0, 0, 0, 0, 0, 0], "flat", "#2a3854");
    if (back) back.lit = lightAt(0, 210, Z_BACK);

    beams.forEach((bz) => {          // so the ceiling has a rhythm, and the lane reads as a podium
      const y = CEIL - 26, half = 11;
      const under = add(C, [[-WALL, y, bz - half], [WALL, y, bz - half], [WALL, y, bz + half],
                            [-WALL, y, bz + half]], ZERO8, "flat", mix("#2c3a56", -0.1));
      if (under) under.lit = lightAt(0, CEIL - 30, bz) * 0.85;
      const face = add(C, [[-WALL, y, bz - half], [WALL, y, bz - half], [WALL, CEIL, bz - half],
                           [-WALL, CEIL, bz - half]], ZERO8, "flat", mix("#232f4a", -0.06));
      if (face) face.lit = AMBIENT * 0.7;
    });

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
      const base = PROP_TINT[m.kind] || "#33435f";
      const shape = SHAPE[m.kind] || "plane";
      const S = m.states ? (m.states[m.st] || m.states[0]) : null;
      const drawn = [];
      if (shape === "box") {
        // Only the faces turned toward the eye are painted, and each carries its own tint: that is
        // the whole trick of volume here, and it costs three quads instead of one.
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix(base, f.k + (lit - 0.7) * 0.24));
          if (q) { q.lit = lit; drawn.push(q); }
        });
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
        // A closed front with a light still burning behind it: the recess, its jambs, the transom, and
        // nothing else. Every point goes through `P`, which takes the wall's own axes — a front on a
        // side wall runs along z and one on the end wall along x, so a face built from either one
        // outright is wrong the moment the other is authored.
        const along = Math.abs(m.ry) > 45;
        const dir = m.x < 0 ? 1 : -1;                 // into the lane, whichever wall this is
        const half = m.w / 2, ins = m.d, head = m.h * 0.84;
        const P = (u, v, y) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l, air) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); }
        };
        // The interior: dark at the floor, lit above where the lamp hangs, and the whole thing brighter
        // the further the shutter is up — the light is the same record the ground pool is read from.
        const up = S && S.shut !== undefined ? S.shut : 0;
        Q([P(-half, ins, 0), P(half, ins, 0), P(half, ins, m.h), P(-half, ins, m.h)], mix(base, -0.14), lit);
        Q([P(-half, ins, 0), P(half, ins, 0), P(half, ins, head * (0.34 + up * 0.66)),
           P(-half, ins, head * (0.34 + up * 0.66))], "#e8b87a", 0.7 + up * 1.15, 0.05);
        Q([P(-half, ins, head), P(half, ins, head), P(half, ins, m.h), P(-half, ins, m.h)], "#f0c98a",
          1.35 + up * 0.5, 0.05);
        // The blade itself, rolled up by `shut`: patterned with the same tile as the cladding, because
        // it is the same shutter, in a recess instead of on a wall.
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
        const along = Math.abs(m.ry) > 45;
        for (let b = 0; b < 2; b++) {
          const off = b ? m.w * 0.28 : -m.w * 0.22;
          const zc = along ? m.z + off : m.z;
          const xc = along ? m.x : m.x + off;
          const r = 33;
          for (const [sx, label] of [[-42, "w"], [42, "w"]]) {
            const pts = [];
            for (let i = 0; i < 8; i++) {
              const a0 = (i / 8) * 6.2832;
              pts.push(along ? [xc, m.y + r + Math.sin(a0) * r, zc + sx + Math.cos(a0) * r * 0.35]
                             : [xc + sx + Math.cos(a0) * r * 0.35, m.y + r + Math.sin(a0) * r, zc]);
            }
            const q = add(C, pts, ZERO8.slice(0, 16), "flat", "#141d2e");
            if (q) { q.lit = lit * 0.8; drawn.push(q); }
          }
          const frame = add(C, along
              ? [[xc, m.y + 26, zc - 30], [xc, m.y + 26, zc + 30], [xc, m.y + 72, zc + 24], [xc, m.y + 72, zc - 24]]
              : [[xc - 30, m.y + 26, zc], [xc + 30, m.y + 26, zc], [xc + 24, m.y + 72, zc], [xc - 24, m.y + 72, zc]],
              ZERO8, "flat", mix(base, 0.22));
          if (frame) { frame.lit = lit; drawn.push(frame); }
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
      } else if (shape === "plate") {
        const q = add(C, [[m.x - m.w / 2, m.y + 1, m.z - m.d / 2], [m.x + m.w / 2, m.y + 1, m.z - m.d / 2],
                          [m.x + m.w / 2, m.y + 1, m.z + m.d / 2], [m.x - m.w / 2, m.y + 1, m.z + m.d / 2]],
                      ZERO8, "flat", base);
        if (q) { q.lit = lit * 0.5; drawn.push(q); }
      } else {
        const q = add(C, corners, uv.flat(), face, base, m.pic);
        if (q) {
          q.lit = m.kind === "vending" ? 1.7 : lit;
          // A hung frame is the one thing in an alley that is lit on purpose: it keeps its own
          // contrast instead of fogging into the wall behind it, or nobody reads the photograph.
          if (m.pic) { q.air = haze(q.z) * 0.4; q.lit = Math.max(lit, 0.72); }
          if (m.kind === "sign") q.lit = 1.6;      // a lit board, blank: no invented lettering
          drawn.push(q);
        }
      }
      m.shown = false;
      if (!drawn.length) { m.el.style.visibility = "hidden"; m.el.tabIndex = -1; return; }
      const q = drawn[0];
      const b = box(C, q);
      let minz = q.z;
      drawn.slice(1).forEach((other) => {          // the control wraps the object, not one face of it
        const o = box(C, other);
        b[0] = Math.min(b[0], o[0]); b[1] = Math.min(b[1], o[1]);
        b[2] = Math.max(b[2], o[0] + o[2]); b[3] = Math.max(b[3], o[1] + o[3]);
        minz = Math.min(minz, other.z);
      });
      b[2] -= b[0]; b[3] -= b[1];
      if (b[2] > 6 && b[3] > 6 && b[0] > -40 && b[0] < W + 40 && b[1] < H + 40 && b[1] > -40) {
        m.el.style.visibility = "visible";
        m.el.tabIndex = 0;
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
      const dx = swayOf(L);
      glow(L.x + dx, L.y, L.z, L.r, L.tint);
      if (L.wet) reflect(L.x + dx, L.z, L.r * 3.6);   // each bulb's pool, thrown back by the asphalt
      const p = camPt(C, L.x, L.y, L.z);
      if (p.z > NEAR) {                            // the bulb itself, so the glow has a body
        const sx = W * 0.5 + (focal * p.x) / p.z, sy = H * 0.5 + (focal * p.y) / p.z;
        g.fillStyle = "rgba(255,240,206,0.92)";
        g.beginPath(); g.arc(sx, sy, Math.max(1.5, (focal * 9) / p.z), 0, 6.2832); g.fill();
      }
    });
    // A wet patch holds whatever is standing above it, which is the only reason the patch is in the
    // data: a puddle that reflects nothing is a grey rectangle. The bulbs already throw their own pool
    // from the loop above; this is for the sources that are not bulbs — a machine, a closed front with
    // its light on — and it can only be done here because the marks say where the ground is wet.
    marks.forEach((mk) => {
      if (mk.kind !== "wet") return;
      lamps.forEach((L) => {
        if (L.wet || L.x < mk.x0 || L.x > mk.x1 || L.z < mk.z0 || L.z > mk.z1) return;
        reflect(L.x, L.z, L.r * 2.2);
      });
    });
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = "rgba(9,15,28,0.9)";
    g.lineWidth = clamp(focal / 520, 1, 3.5);
    const strand = (a, b, sag) => {
      let open = false;
      g.beginPath();
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const p = camPt(C, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag,
                        a[2] + (b[2] - a[2]) * t);
        if (p.z < NEAR) break;
        const sx = W * 0.5 + (focal * p.x) / p.z, sy = H * 0.5 + (focal * p.y) / p.z;
        if (open) g.lineTo(sx, sy); else { g.moveTo(sx, sy); open = true; }
      }
      if (open) g.stroke();
    };
    wires.forEach((wd) => strand(wd.a, wd.b, wd.sag || 40));
    // Anything with a body is tied to the wire above it, at the height the data gave it rather than a
    // constant: a lantern at 2.6 m and a bulb at 2.7 m do not hang the same length.
    lamps.forEach((L) => {
      const dx = swayOf(L);
      if (L.wet) strand([L.x, CEIL, L.z], [L.x + dx * 0.4, L.y + 6, L.z], 0);
      // A cord is drawn from the wire to where the paper actually is, so the swing is visible in the
      // line that holds it and not only in the lamp.
      if (L.body === "lantern") strand([L.x, CEIL, L.z], [L.x + dx, L.h || (L.y + 14), L.z], 0);
    });
    // What the lanterns put into the air: a shallow cone from the paper down to the ground it lights,
    // in the same composite as the glow and by the same projection as everything else. It is four
    // quads for the whole lane, and it is the difference between four bright dots and four lamps.
    lamps.forEach((L) => {
      if (L.body !== "lantern") return;
      const dx = swayOf(L), R = L.size || 24;
      const top = camPt(C, L.x + dx, L.y - R, L.z), bot = camPt(C, L.x + dx * 1.5, 2, L.z);
      if (top.z < NEAR || bot.z < NEAR) return;
      const ax = W * 0.5 + (focal * top.x) / top.z, ay = H * 0.5 + (focal * top.y) / top.z;
      const bx = W * 0.5 + (focal * bot.x) / bot.z, by = H * 0.5 + (focal * bot.y) / bot.z;
      const wa = (focal * R * 0.85) / top.z, wb = (focal * R * 2.9) / bot.z;
      const gr = g.createLinearGradient(ax, ay, bx, by);
      gr.addColorStop(0, "rgba(255,198,128,0.15)");
      gr.addColorStop(1, "rgba(255,168,96,0)");
      g.beginPath();
      g.moveTo(ax - wa, ay); g.lineTo(ax + wa, ay); g.lineTo(bx + wb, by); g.lineTo(bx - wb, by);
      g.closePath();
      g.fillStyle = gr; g.fill();
    });

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

  const liveEl = layer.querySelector("[data-walk-live]");
  const say = (status, record) => {
    if (status && statusEl) statusEl.textContent = status;
    if (record !== undefined && recordEl) recordEl.textContent = record;
    // The card is where the sentence can be read, so it is kept in step with the announced one while
    // it is open: a line that goes stale behind a click is worse than no line at all.
    if (liveEl && card && !card.hidden) {
      liveEl.textContent = [status, record].filter(Boolean).join(" ") || "Nothing is in front of you.";
    }
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
  // The chip's name lives in `aria-label` now, because nothing is written on the display any more;
  // splitting it is the whole difference between an announced status and a painted one.
  const labels = stops.map((el) => (el.getAttribute("aria-label") || "").split(",")[0].trim());

  /* The reach: what you can open is decided by where you stand and where you look, so the scene
     answers before anything is pressed, and `E` is never a guess. */
  const a = () => (yaw * Math.PI) / 180;
  const checkReach = () => {
    const fx = Math.sin(a()), fd = Math.cos(a());
    // Which frame you are standing at is asked on every frame, not only when the reach changes. Three
    // returns below end this function early, and a station highlight that went stale because a shrine
    // happened to be in front of you would be the kind of lie the rail tells without meaning to.
    markStops();
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
    if (!best) { layer.classList.remove("has-reach"); return; }
    best.el.classList.add("is-reach");
    // One non-verbal signal for the whole display: the note button carries a dot while there is
    // something to read about what is in front of you.
    layer.classList.add("has-reach");
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
    // jump with no horizontal speed would otherwise freeze in mid-air. This is also why there is no
    // "pause while an overlay is open" step: the loop is already driven by motion, so an open plate
    // costs nothing to animate, and the keys are held by the guards in the handler below.
    if (speed > 4 || gliding || height > 0 || vy !== 0) loop();
    else startPulse();          // standing still is when the lane needs to keep breathing
  };
  // Asking for a real frame hands the pumping over to rAF, so the idle pulse is cancelled here rather
  // than at each call site: one owner for the two pumps, and never both at once.
  const loop = () => { stopPulse(); if (!raf) raf = requestAnimationFrame(tick); };

  /* An idle repaint, at eleven frames a second rather than sixty.

     The lamp cords swing and the machine flickers whether or not you are moving, and a scene that only
     animates while it is being driven looks like a screenshot the moment you stop. The budget is
     deliberate: a walking frame costs 2 926 fills, so an idle tick is roughly one in six of the work
     of a moving one, it stops when the page scrolls away or the plate is open, and `prefers-reduced-motion`
     turns it off at the source instead of cancelling it after it has been paid for. */
  let pulse = 0, inView = true;
  const stopPulse = () => { if (pulse) { clearTimeout(pulse); pulse = 0; } };
  const startPulse = () => {
    stopPulse();
    if (reduce() || !inView || (plate && plate.classList.contains("is-open"))) return;
    // The nudge calls the *tick*, and the tick decides what happens next — rAF if the body is moving,
    // another nudge if it is not. A bare repaint would look the same while standing still but would
    // strand a glide halfway down the lane, and a walker frozen between two frames is worse than a
    // lane that did not breathe.
    pulse = setTimeout(() => { pulse = 0; tick(performance.now()); }, 90);
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => {
      inView = es.some((e) => e.isIntersecting);
      if (inView) startPulse(); else stopPulse();
    }, { threshold: 0.01 }).observe(layer);
  }

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
    pics.forEach((img) => { img.onload = () => { if (!raf) draw(); }; });
    if (!g) {
      // The reference names its fallback instead of hiding it: a visitor with no canvas gets the
      // sentence and the list, not a black rectangle that looks like a broken image.
      if (noRaster) noRaster.hidden = false;
      say("Rendering the lane is unavailable here · the list still reads", "");
      showSpace();
      if (listBtn) toggleList(true);
      return;
    }
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
    card.hidden = true;
    if (card.dataset.mode !== "prop") card.dataset.mode = "prop";
    if (asideEl) asideEl.hidden = true;
    if (infoBtn) infoBtn.setAttribute("aria-expanded", "false");
  };
  const showCard = (m) => {
    if (!card) return;
    const where = card.querySelector("[data-walk-where]");
    const title = card.querySelector("[data-walk-title]");
    const hint = card.querySelector("[data-walk-hint]");
    card.dataset.mode = "prop";
    if (asideEl) asideEl.hidden = true;      // the lane's own note is not this prop's business
    if (where) where.textContent = `${district} · ${metres(m.z)} in`;
    const st = m.states ? (m.states[m.st] || null) : null;
    if (title) title.textContent = m.el.dataset.title || "";
    if (hint) hint.textContent = st ? st.say : (m.el.dataset.hint || "");
    if (liveEl) liveEl.textContent = statusEl ? statusEl.textContent : "";
    card.hidden = false;
    if (infoBtn) infoBtn.setAttribute("aria-expanded", "false");
    const btn = card.querySelector("[data-walk-card-close]");
    if (btn) btn.focus({ preventScroll: true });
  };
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
    if (hint) hint.textContent = thing
      ? "Its own card holds the reason a thing like this is in the space: press E, or open the list for "
        + "everything at once."
      : "Nothing here is labelled and nothing is named: the shutters carry no shop, the board is blank, "
        + "because a name would be a claim about a place that is drawn rather than found.";
    if (liveEl) liveEl.textContent = statusEl ? statusEl.textContent : "";
    card.hidden = false;
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
    // The curtain at your back is the way out of the space and into the rest of the site, and the
    // record says so: `data-leave` is authored on the prop, so the renderer obeys rather than knowing
    // an id. Pressing it used to open a card that read "part it to leave the lane" and did nothing,
    // which is the worst kind of dead end — a control that describes an exit instead of being one.
    const leave = m.el.dataset.leave;
    if (leave) { window.location.assign(leave); return; }
    if (m.el.dataset.frame !== undefined && openRail(Number(m.el.dataset.frame), m.el)) return;
    if (m.el.dataset.obj === "vending" && openRail(0, m.el)) return;
    // A thing with stops is opened by being *used*: the shutter goes up, the flap swings, and the card
    // says what the lane looks like now. Pressing it again takes it to the next stop.
    if (m.states && m.states.length > 1) { setState(m, (m.st + 1) % m.states.length); draw(); }
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
    // to stay separable, or tapping the vending machine would swing the camera. And only the primary
    // button turns the head — pointerdown fires for the right and middle buttons too, and a scroll
    // widget or a context menu arriving mid-swing is the difference between a camera and a fight.
    if (event.button !== 0) return;
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
  const release = () => { down = null; view.classList.remove("is-dragging"); };
  /* A tap that never became a look is a press. `E` has a key and no finger, so on a phone every wall
     thing was pressable and none of them could be pressed — which is what "the interaction is off"
     reported. A tap with a card open closes it instead, because the same finger that opened something
     should be able to put it down. */
  const up = () => {
    const tap = !!down && down.moved < 8;
    release();
    if (!tap) return;
    if (card && !card.hidden) { hideCard(); return; }
    if (reach) act(reach);
  };
  view.addEventListener("pointerup", up);
  view.addEventListener("pointercancel", release);
  // A menu opened over a drag would strand `is-dragging` on the layer and leave the cursor grabbing
  // forever, so the only right-click that is refused is the one that arrives while a turn is live.
  view.addEventListener("contextmenu", (event) => { if (down) event.preventDefault(); });
  view.addEventListener("auxclick", (event) => { if (event.button === 1) event.preventDefault(); });
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
  window.addEventListener("resize", () => { size(); draw(); });
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
    // The full-format ground is the frame's own pixels, so the screen behind the story changes with the
    // story; `url(...)` of an already-loaded file costs one decode and no bytes.
    if (panel) {
      const src = frames[fi] && frames[fi].querySelector("img");
      panel.style.setProperty("--fill", src && src.getAttribute("src") ? `url("${src.getAttribute("src")}")` : "none");
    }
    if (countEl) countEl.textContent = `${fi + 1} of ${frames.length}`;
  };
  const stopTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const schedule = () => {
    stopTimer();
    if (!ease || paused || frames.length < 2) return;
    timer = setTimeout(() => { fi = (fi + 1) % frames.length; paint(); schedule(); }, HOLD);
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

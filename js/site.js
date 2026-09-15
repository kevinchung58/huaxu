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

/* ---- Districts: the lane (rooms page) ----
   The stage is the whole interface: drag to turn, W and S between the painted spots on
   the floor, objects opened by click or Enter. Deliberate limits, each one a choice:
     - the eye does not move; the world is translated and rotated instead, so no camera
       math and no WebGL is needed for a lane with one axis of travel;
     - yaw and pitch are clamped to ±35° and ±10°, because past that the walls stop
       covering the viewport and the room shows its own edges;
     - turning is drag, not Pointer Lock: the reference site does the same, and it is what
       keeps a walkable space available on a phone.
   Objects that only narrate themselves open the plate, which reuses the site's shared
   overlay helpers; the curtain is a way out and the shrine is a way to choose a slot, so
   neither opens a dialog. With scripting off, everything on the page is still readable as
   the slot list, which is the point of keeping the list on the same page as the lane. */
(function () {
  const stage = document.querySelector("[data-room-stage]");
  if (!stage) return;
  const world = stage.querySelector("[data-room-world]");
  const stations = Array.from(stage.querySelectorAll("[data-station]"));
  const plate = document.getElementById("room-plate");
  const ease = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_YAW = 35, MAX_PITCH = 10, STRAFE = 76;
  // A dead-straight view looks like a flat picture of a corridor, which is the question the
  // owner keeps asking; a few degrees of turn makes the perspective undeniable on arrival.
  let yaw = -7, pitch = -3, panX = 0, here = 0, opener = null, zoom = 1;

  const depthOf = (i) => Math.round(parseFloat(stations[i] ? stations[i].style.getPropertyValue("--z") : "0") || 0);
  const plan = document.querySelector("[data-plan-cam]");
  const rows = Array.from(document.querySelectorAll(".frame-row[data-row-obj]"));
  const hereLine = document.querySelector("[data-room-here]");
  const planDots = Array.from(document.querySelectorAll("[data-plan-to]"));
  const say = () => {
    if (!hereLine) return;
    const name = stations[here] && stations[here].querySelector(".station-name");
    hereLine.textContent = name ? `standing at ${name.textContent}` : "";
  };
  /* The corridor is 640px wide by construction. On a narrow stage the whole world is scaled down
     rather than clipped, which is the difference between a small room and a cropped one. */
  const fit = () => {
    // The lane is 640px wide by construction, so a narrow stage scales the world down instead of
    // clipping it: a small room, not a cropped one. The zoom control rides on top of that fit
    // factor, because leaning in on a phone is a question of fit rather than of taste.
    const fitK = stage.clientWidth ? Math.min(1, stage.clientWidth / 660) : 1;
    world.style.setProperty("--k", (fitK * zoom).toFixed(3));
  };
  fit();
  if (typeof ResizeObserver === "function") new ResizeObserver(fit).observe(stage);
  else window.addEventListener("resize", fit);
  const apply = () => {
    world.style.setProperty("--yaw", `${yaw.toFixed(1)}deg`);
    world.style.setProperty("--pitch", `${pitch.toFixed(1)}deg`);
    world.style.setProperty("--pan-x", `${panX.toFixed(0)}px`);
    world.style.setProperty("--pan-z", `${depthOf(here)}px`);
    if (plan) {
      plan.parentElement.style.setProperty("--plan-ry", `${(180 - yaw).toFixed(1)}deg`);
      plan.style.setProperty("--plan-x", `${(panX * 0.14).toFixed(1)}px`);
      const pc = stations[here] && stations[here].style.getPropertyValue("--pc");
      if (pc) plan.style.setProperty("--plan-pct", pc);
    }
    planDots.forEach((el, n) => el.classList.toggle("is-here", n === here));
    rows.forEach((row) => row.classList.toggle("is-here", row.at === here));
    say();
  };
  const walkTo = (i) => {
    here = Math.max(0, Math.min(stations.length - 1, i));
    stations.forEach((el, j) => {
      el.classList.toggle("is-here", j === here);
      if (j === here) el.setAttribute("aria-current", "step");
      else el.removeAttribute("aria-current");
    });
    apply();
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  /* The lane and the list are one selection: a frame in the list is a position on the wall, so a
     deep link moves the camera instead of opening a second interface. */
  const depthAt = (el) => Math.round(parseFloat(el.style.getPropertyValue("--z")) || 0);
  const nearest = (z) => stations.reduce(
    (best, el, i) => (Math.abs(depthOf(i) - z) < Math.abs(depthOf(best) - z) ? i : best), 0);
  const focusFrame = (n) => {
    const obj = stage.querySelector(`[data-frame="${n}"]`);
    if (obj) walkTo(nearest(depthAt(obj)));
  };

  let drag = null;
  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".room-obj, .room-station")) return;
    drag = { x: event.clientX, y: event.clientY, yaw, pitch };
    world.classList.add("is-dragging");
    if (stage.setPointerCapture) stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag) return;
    yaw = clamp(drag.yaw + (event.clientX - drag.x) * 0.14, -MAX_YAW, MAX_YAW);
    pitch = clamp(drag.pitch - (event.clientY - drag.y) * 0.08, -MAX_PITCH, MAX_PITCH);
    apply();
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    world.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("keydown", (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const k = event.key.toLowerCase();
    if (k === "w" || k === "s") {
      event.preventDefault();
      walkTo(here + (k === "w" ? 1 : -1));
      return;
    }
    if (k === "a" || k === "d") {
      event.preventDefault();
      panX = clamp(panX + (k === "d" ? -26 : 26), -STRAFE, STRAFE);
    } else if (k === "arrowleft") yaw = clamp(yaw + 8, -MAX_YAW, MAX_YAW);
    else if (k === "arrowright") yaw = clamp(yaw - 8, -MAX_YAW, MAX_YAW);
    else if (k === "arrowup") pitch = clamp(pitch + 3, -MAX_PITCH, MAX_PITCH);
    else if (k === "arrowdown") pitch = clamp(pitch - 3, -MAX_PITCH, MAX_PITCH);
    else return;
    event.preventDefault();
    apply();
  });

  /* The rail: the plate doubles as a stories player when it is opened from a frame.
     Mechanics only, borrowed from what makes that format usable rather than from its
     branding — segments instead of one bar, right two thirds forward and left third
     back, hold to pause, one frame at a time, and no auto-advance under
     prefers-reduced-motion, where the same taps still work. Nothing here marks a frame
     as viewed, because a scholar's archive is not a queue that eats itself. */
  const railEl = plate && plate.querySelector("[data-story-reel]");
  const frames = railEl ? Array.from(railEl.querySelectorAll("[data-story-frame]")) : [];
  const segRow = plate && plate.querySelector("[data-story-segs]");
  const countEl = plate && plate.querySelector("[data-story-count]");
  const panel = plate && plate.querySelector(".modal-panel");
  let fi = 0, timer = null, paused = false;
  if (railEl && frames.length && segRow) {
    frames.forEach(() => {
      const seg = document.createElement("span");
      seg.className = "story-seg";
      seg.appendChild(document.createElement("i"));
      segRow.appendChild(seg);
    });
  }
  const segs = segRow ? Array.from(segRow.children) : [];
  const paint = () => {
    frames.forEach((f, j) => { f.hidden = j !== fi; });
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
    focusFrame(n);
    paint();
    opener = enterOverlay(plate, ".modal-close", trigger);
    schedule();
    return true;
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

  const closePlate = () => {
    if (!plate || !plate.classList.contains("is-open")) return;
    if (typeof stopTimer === "function") stopTimer();
    paused = false;
    plate.classList.remove("is-open", "is-rail");
    leaveOverlay(plate, opener);
    opener = null;
  };
  const openPlate = (obj) => {
    if (!plate) return;
    plate.querySelector("[data-room-where]").textContent = stage.closest("[data-room]")
      ? stage.closest("[data-room]").dataset.room
      : "";
    plate.querySelector("[data-room-title]").textContent = obj.dataset.title || "";
    plate.querySelector("[data-room-hint]").textContent = obj.dataset.hint || "";
    plate.classList.add("is-open");
    opener = enterOverlay(plate, ".modal-close", obj);
  };

  /* One selection, two projections: a row in the list is the same record as a spot on the
     wall, so the list drives the camera and the camera marks the list. That is also what makes
     the lane skippable — nothing reachable in the 3D view is missing from the list. */
  rows.forEach((row) => {
    const obj = stage.querySelector(`[data-obj="${row.dataset.rowObj}"]`);
    if (!obj) return;
    row.at = nearest(depthAt(obj));
    row.addEventListener("pointerenter", () => walkTo(row.at));
    row.addEventListener("focusin", () => walkTo(row.at));
    const play = row.querySelector("[data-play]");
    if (play) play.addEventListener("click", () => openRail(Number(play.dataset.play), play));
  });

  Array.from(stage.querySelectorAll("[data-obj]")).forEach((obj) => {
    const show = () => { if (hereLine && obj.dataset.title) hereLine.textContent = obj.dataset.title; };
    obj.addEventListener("pointerenter", show);
    obj.addEventListener("focus", show);
  });
  stage.addEventListener("pointerleave", say);

  const slots = Array.from(document.querySelectorAll(".slot"));
  let drawn = 0;
  Array.from(stage.querySelectorAll("[data-obj]")).forEach((obj) => {
    obj.addEventListener("click", () => {
      if (obj.classList.contains("room-noren")) {
        const picker = document.querySelector(".district-pick");
        if (picker) picker.scrollIntoView({ behavior: ease ? "smooth" : "auto", block: "start" });
        return;
      }
      if (obj.classList.contains("room-shrine") && slots.length) {
        slots.forEach((el) => el.classList.remove("is-drawn"));
        const next = slots[drawn % slots.length];
        drawn += 1;
        next.classList.add("is-drawn");
        next.scrollIntoView({ behavior: ease ? "smooth" : "auto", block: "center" });
        return;
      }
      if (obj.dataset.frame !== undefined && openRail(Number(obj.dataset.frame), obj)) return;
      if (obj.dataset.obj === "vending" && openRail(0, obj)) return;
      openPlate(obj);
    });
  });
  stations.forEach((el, i) => el.addEventListener("click", () => walkTo(i)));
  planDots.forEach((el, i) => el.addEventListener("click", () => walkTo(i)));
  Array.from(stage.querySelectorAll("[data-zoom]")).forEach((btn) => btn.addEventListener("click", () => {
    zoom = clamp(zoom + Number(btn.dataset.zoom) * 0.12, 0.72, 1.28);
    fit();
  }));
  if (plate) {
    Array.from(plate.querySelectorAll("[data-room-close]")).forEach((el) => el.addEventListener("click", closePlate));
    plate.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePlate();
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
  const fromHash = () => {
    const m = (location.hash || "").match(/^#frame-[a-z0-9]+-([a-z0-9-]+)$/i);
    if (!m) return;
    const obj = stage.querySelector(`[data-obj="frame-${m[1]}"]`);
    if (obj) walkTo(nearest(depthAt(obj)));
  };
  walkTo(0);
  fromHash();
  window.addEventListener("hashchange", fromHash);
})();


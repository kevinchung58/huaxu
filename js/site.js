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

  const slides = [...document.querySelectorAll("[data-lightbox]")];
  let slideIndex = 0;

  const showDeck = (index) => {
    if (!slides.length) return;
    slideIndex = (index + slides.length) % slides.length;
    const current = slides[slideIndex];
    document.querySelectorAll("[data-slide]").forEach((el) => {
      el.classList.toggle("is-on", Number(el.dataset.slide) === slideIndex);
    });
    document.querySelectorAll("[data-go]").forEach((el) => {
      el.classList.toggle("is-on", Number(el.dataset.go) === slideIndex);
    });
    const cap = document.querySelector("[data-deck-cap]");
    const num = document.querySelector("[data-deck-n]");
    if (cap) cap.textContent = current.dataset.caption || current.dataset.alt || "";
    if (num) num.textContent = String(slideIndex + 1);
  };

  document.querySelector("[data-deck-prev]")?.addEventListener("click", () => showDeck(slideIndex - 1));
  document.querySelector("[data-deck-next]")?.addEventListener("click", () => showDeck(slideIndex + 1));
  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => showDeck(Number(btn.dataset.go)));
  });

  const lightbox = document.querySelector("#lightbox");
  if (lightbox && slides.length) {
    const img = lightbox.querySelector("img");
    const cap = lightbox.querySelector("[data-lamp-cap]");
    const count = lightbox.querySelector("[data-lamp-count]");
    const prev = lightbox.querySelector("[data-lamp-prev]");
    const next = lightbox.querySelector("[data-lamp-next]");
    const many = slides.length > 1;
    if (prev) prev.hidden = !many;
    if (next) next.hidden = !many;
    if (count) count.hidden = !many;

    const paint = () => {
      const current = slides[slideIndex];
      img.src = current.dataset.src;
      img.alt = current.dataset.alt || "";
      if (cap) cap.textContent = current.dataset.caption || current.dataset.alt || "";
      if (count) count.textContent = `${slideIndex + 1} / ${slides.length}`;
      showDeck(slideIndex);
    };
    const open = (index) => {
      showDeck(index);
      paint();
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    slides.forEach((btn, index) => btn.addEventListener("click", () => open(index)));
    prev?.addEventListener("click", () => {
      showDeck(slideIndex - 1);
      paint();
    });
    next?.addEventListener("click", () => {
      showDeck(slideIndex + 1);
      paint();
    });
    lightbox.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") close();
      if (many && event.key === "ArrowLeft") {
        showDeck(slideIndex - 1);
        paint();
      }
      if (many && event.key === "ArrowRight") {
        showDeck(slideIndex + 1);
        paint();
      }
    });
  }
})();

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

  // Build the 5x5 dot field once.
  for (let i = 0; i < SIZE * SIZE; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot-cell-btn";
    b.dataset.dot = String(i);
    b.setAttribute("aria-label", `Dot at row ${Math.floor(i / SIZE) + 1}, column ${(i % SIZE) + 1}`);
    b.innerHTML = '<span class="dot" aria-hidden="true"></span>';
    b.addEventListener("click", () => onTap(i));
    board.appendChild(b);
    dots.push(b);
  }

  const resetBoard = () => {
    dots.forEach((d) => {
      d.classList.remove("is-lit", "is-done", "is-wrong");
      d.removeAttribute("data-n");
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

  const numberPath = () => { seq.forEach((di, n) => { dots[di].dataset.n = String(n + 1); }); };

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
    document.body.style.overflow = "hidden";
    game.querySelector(".dot-game-close").focus();
    watch();
  };

  const closeGame = () => {
    clearTimers();
    phase = "idle";
    game.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
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
    if (event.key !== "Tab") return;
    const focusables = Array.from(game.querySelectorAll("button")).filter((el) => !el.hidden && !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();

(() => {
  const nav = document.querySelector(".nav");
  const more = document.querySelector(".more");
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

  if (more) {
    const btn = more.querySelector(".more-btn");
    btn?.addEventListener("click", (event) => {
      event.stopPropagation();
      more.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(more.classList.contains("is-open")));
    });
    document.addEventListener("click", () => more.classList.remove("is-open"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") more.classList.remove("is-open");
    });
  }

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

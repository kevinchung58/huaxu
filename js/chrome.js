/* The page's own chrome: the nav that marks itself scrolled, the "more" menus, the mobile menu, the
   back-to-top button and the featured-photograph modal. It runs on every page and reads nothing from
   the lane.

   Reads from `js/overlay.js`: `overlayEntered`, `overlayLeft` (the two history calls), and so it is
   loaded after that file. Nothing reads this file: it is one IIFE and every name in it is its own.
   ---------------------------------------------------------------------------------------------- */

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

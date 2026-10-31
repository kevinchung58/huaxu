/* The page's own chrome: the nav, menus, back-to-top button, portrait, publication filters and
   featured-paper modal. The modal uses the focus and history helpers in js/overlay.js, loaded first.
   Nothing reads this file: it is one IIFE and every name in it is its own.
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
      if (toggle && mobile?.classList.contains("is-open")) {
        mobile.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
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
    const toggle = () => {
      p.classList.add("is-controlled");
      p.setAttribute("aria-pressed", String(p.classList.toggle("is-alt")));
    };
    p.addEventListener("click", toggle);
    p.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
    // A new hover/focus may preview the portrait again, but an explicit toggle takes
    // precedence until the pointer or focus leaves the control.
    p.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "touch") p.classList.remove("is-controlled");
    });
    p.addEventListener("blur", () => p.classList.remove("is-controlled"));
  });

  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    const chips = group.querySelectorAll("[data-filter]");
    const items = document.querySelectorAll("[data-pub-type]");
    const years = document.querySelectorAll("[data-year]");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => {
          const selected = c === chip;
          c.classList.toggle("is-on", selected);
          c.setAttribute("aria-pressed", String(selected));
        });
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
          const count = [...block.querySelectorAll("[data-pub-type]")].filter((el) => !el.hidden).length;
          block.hidden = count === 0;
          const label = block.querySelector("h3 > span");
          if (label) label.textContent = `${count} publication${count === 1 ? "" : "s"}`;
        });
      });
    });
  });

  const bindFeatured = () => {
    const modal = document.querySelector("#featured-modal");
    if (!modal) return;
    const title = modal.querySelector("[data-modal-title]");
    const authors = modal.querySelector("[data-modal-authors]");
    const source = modal.querySelector("[data-modal-source]");
    const note = modal.querySelector("[data-modal-note]");
    const doi = modal.querySelector("[data-modal-doi]");
    let trigger = null;
    const open = (btn) => {
      if (modal.classList.contains("is-open")) return;
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
      trigger = enterOverlay(modal, ".modal-close", btn);
    };
    const close = () => {
      if (!modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      leaveOverlay(modal, trigger);
      trigger = null;
    };
    document.querySelectorAll("[data-featured]").forEach((btn) => btn.addEventListener("click", () => open(btn)));
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
      else trapTab(modal, event);
    });
  };
  // The generated dialog follows the scripts in the page; wait for it rather than
  // attaching listeners to an element that has not been parsed yet.
  if (document.querySelector("#featured-modal")) bindFeatured();
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindFeatured, { once: true });
})();

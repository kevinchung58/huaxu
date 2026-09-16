"""The other half of the fold: the script's side of an interface that shows no words.

Also fixes a defect the fold exposed, and one it did not: `labels` used to be scraped out of the
station buttons' text content, which is gone now, and a texture's `onload` still reached for `on` — a
flag deleted with `fold()` two rounds ago, which no test could catch because the stub `Image` fires its
load handler synchronously during construction, before the handler is attached.
"""
import io

p = "js/site.js"
s = io.open(p, encoding="utf-8").read()


def rep(old, new):
    global s
    assert s.count(old) == 1, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, 1)
    io.open(p, "w", encoding="utf-8").write(s)
    print("  patched:", old[:46].replace("\n", " "))


# a late texture must repaint on its own, and `on` no longer exists to ask
rep("    pics.forEach((img) => { img.onload = () => { if (on && !raf) draw(); }; });",
    "    pics.forEach((img) => { img.onload = () => { if (!raf) draw(); }; });")

# the words the ticks used to wear are now their accessible names
rep('  const labels = stops.map((el) => (el.textContent || "").trim());',
    '''  // The chip's name lives in `aria-label` now, because nothing is written on the display any more;
  // splitting it is the whole difference between an announced status and a painted one.
  const labels = stops.map((el) => (el.getAttribute("aria-label") || "").split(",")[0].trim());''')

# one sentence, three places: the announced line, the card's live line, and nothing on the display
rep('''  const say = (status, record) => {
    if (status && statusEl) statusEl.textContent = status;
    if (record !== undefined && recordEl) recordEl.textContent = record;
  };''',
'''  const liveEl = layer.querySelector("[data-walk-live]");
  const say = (status, record) => {
    if (status && statusEl) statusEl.textContent = status;
    if (record !== undefined && recordEl) recordEl.textContent = record;
    // The card is where the sentence can be read, so it is kept in step with the announced one while
    // it is open: a line that goes stale behind a click is worse than no line at all.
    if (liveEl && card && !card.hidden) {
      liveEl.textContent = [status, record].filter(Boolean).join(" ") || "Nothing is in front of you.";
    }
  };''')

# the reach announces itself with a dot, not with a caption
rep('''    best.el.classList.add("is-reach");''',
'''    best.el.classList.add("is-reach");
    // One non-verbal signal for the whole display: the note button carries a dot while there is
    // something to read about what is in front of you.
    layer.classList.add("has-reach");''')

rep('''    if (reach) reach.el.classList.remove("is-reach");
    reach = best;
    if (!best) { markStops(); return; }''',
'''    if (reach) reach.el.classList.remove("is-reach");
    reach = best;
    if (!best) { layer.classList.remove("has-reach"); markStops(); return; }''')

# ---- the folded note: one button, one card, two modes -------------------------------------------
rep('''  const hideCard = () => {
    if (!card) return;
    card.hidden = true;
  };''',
'''  const infoBtn = layer.querySelector("[data-walk-info]");
  const asideEl = card && card.querySelector("[data-walk-aside]");
  const hideCard = () => {
    if (!card) return;
    card.hidden = true;
    if (card.dataset.mode !== "prop") card.dataset.mode = "prop";
    if (asideEl) asideEl.hidden = true;
    if (infoBtn) infoBtn.setAttribute("aria-expanded", "false");
  };''')

rep('''  const showCard = (m) => {
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
  };''',
'''  const showCard = (m) => {
    if (!card) return;
    const where = card.querySelector("[data-walk-where]");
    const title = card.querySelector("[data-walk-title]");
    const hint = card.querySelector("[data-walk-hint]");
    card.dataset.mode = "prop";
    if (asideEl) asideEl.hidden = true;      // the lane's own note is not this prop's business
    if (where) where.textContent = `${district} · ${metres(m.z)} in`;
    if (title) title.textContent = m.el.dataset.title || "";
    if (hint) hint.textContent = m.el.dataset.hint || "";
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
  });''')

# the fallback names itself by opening: an empty space with no explanation is what this page refuses
rep('''      if (noRaster) noRaster.hidden = false;
      say("Rendering the lane is unavailable here · the list below still reads", "");
      if (listBtn) toggleList(true);
      return;''',
'''      if (noRaster) noRaster.hidden = false;
      say("Rendering the lane is unavailable here · the list still reads", "");
      showSpace();
      if (listBtn) toggleList(true);
      return;''')

io.open(p, "w", encoding="utf-8").write(s)
print("done")

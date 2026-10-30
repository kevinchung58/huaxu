/* The modal standard every overlay on this site uses: one way to open a surface, keep the page under
   it inert and out of the tab order, give the browser's back button the same meaning as the close
   button, and put focus back where it was.

   LOADED FIRST, and this is the one file in the group that others read by name. Its whole interface:

     inertOutside(root, on)                  everything outside `root` is inert, or not
     trapTab(root, event)                    Tab and Shift-Tab stay inside `root`
     enterOverlay(root, focusSel, trigger)   open: a history entry, inert, focus
     leaveOverlay(root, trigger)             close: history, inert, focus back
     overlayEntered() / overlayLeft()        the two history bookkeeping calls
     OVERLAY_SURFACE                         the selector list of what counts as an overlay

   The three `let`s below (`overlayDepth`, `ownPop`, `foldingFromHistory`) are this file's own state:
   no other file reads or writes them. A classic script's top-level `let` still lives in the page's
   global lexical environment, so a later script can see these names — the interface above is what
   later scripts are allowed to use, not the whole scope.

   Split out of `js/site.js` on 2026-10-30. The gates do not know the difference: they read the file
   list in `bin/site-sources.json` and join it in order, which is what the page loads.
   ---------------------------------------------------------------------------------------------- */

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

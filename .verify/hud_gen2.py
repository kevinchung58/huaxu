"""Remaining folds: the head-up display, the card, the album wall. (Idempotent by construction — a
block that is already folded is skipped instead of asserted.)"""
import io

p = "_gen_html.py"
s = io.open(p, encoding="utf-8").read()


def rep(old, new):
    global s
    if new in s:
        print("  already folded:", old[:44].replace("\n", " "))
        return
    assert s.count(old) == 1, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, 1)
    io.open(p, "w", encoding="utf-8").write(s)
    print("  folded:", old[:44].replace("\n", " "))


rep('''  <div class="walk-hud">
    <div class="walk-top">
      <div class="walk-pick">
        <a class="walk-home" href="index.html">{ICON_LEFT}Hua-Xu Zhong</a>
        <p class="walk-eyebrow">{label} · one lane, drawn</p>
        <div class="walk-stops" role="group" aria-label="Stops in this lane">{"".join(chips)}</div>
      </div>
      <div class="walk-read">
        <p class="walk-status" data-walk-status role="status">Building the lane…</p>
        <p class="walk-record" data-walk-record></p>
      </div>
    </div>
    <div class="walk-bottom">
      <div class="walk-tools">
        <span class="walk-fov"><button type="button" data-walk-fov="-1" aria-label="Wider view">−</button
        ><button type="button" data-walk-fov="1" aria-label="Narrower view">+</button></span>
        <button type="button" class="walk-jump" data-walk-jump>Jump</button>
        <button type="button" data-walk-list aria-expanded="false" aria-controls="walk-list-{did}">The list
        </button>
      </div>
      <p class="walk-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk ·
        <kbd>Shift</kbd> run · <kbd>Space</kbd> jump · drag to turn · <kbd>E</kbd> open ·
        <kbd>L</kbd> list</p>
      <p class="walk-note" data-walk-fallback hidden>Rendering the lane is unavailable in this
        browser. {label} still reads below: every frame, its caption and its kind are in the list.</p>
      <p class="walk-note">{label} is drawn, not surveyed: the distances are the artist's, and a
        frame is a depiction of a place rather than a record of standing in it.</p>
    </div>
  </div>''',
'''  <div class="walk-hud">
    <div class="walk-top">
      <div class="walk-pick">
        <a class="walk-icon" href="index.html" aria-label="Hua-Xu Zhong">{ICON_LEFT}</a>
        <div class="walk-stops" role="group" aria-label="Stops in this lane">{"".join(chips)}</div>
      </div>
      <div class="walk-read">
        <p class="sr-only" data-walk-status role="status">Building the lane…</p>
        <p class="sr-only" data-walk-record aria-live="polite"></p>
      </div>
    </div>
    <div class="walk-bottom">
      <div class="walk-tools">
        <span class="walk-fov"><button type="button" class="walk-icon" data-walk-fov="-1"
          aria-label="Wider view">−</button
        ><button type="button" class="walk-icon" data-walk-fov="1"
          aria-label="Narrower view">+</button></span>
        <button type="button" class="walk-icon walk-jump" data-walk-jump aria-label="Jump">{ICON_UP}</button>
        <button type="button" class="walk-icon walk-info" data-walk-info aria-expanded="false"
          aria-controls="walk-card-{did}" aria-label="What this lane is, and how to move in it">{ICON_CHAT}</button>
        <button type="button" class="walk-icon" data-walk-list aria-expanded="false"
          aria-controls="walk-list-{did}" aria-label="The lane, written out">{ICON_BOOK}</button>
      </div>
    </div>
  </div>''')

rep('''  <div class="walk-card" data-walk-card hidden>
    <p class="eyebrow" data-walk-where></p>
    <h2 data-walk-title></h2>
    <p data-walk-hint></p>
    <button type="button" class="modal-close" data-walk-card-close aria-label="Close">{ICON_X}</button>
  </div>''',
'''  <div class="walk-card" id="walk-card-{did}" data-walk-card data-mode="prop" hidden>
    <p class="eyebrow" data-walk-where></p>
    <h2 data-walk-title></h2>
    <p data-walk-hint></p>
    <p class="when" data-walk-live></p>
    <div class="walk-aside" data-walk-aside hidden>
      <p class="walk-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk ·
        <kbd>Shift</kbd> run · <kbd>Space</kbd> jump · drag to turn · <kbd>E</kbd> open a thing ·
        <kbd>L</kbd> the list</p>
      <p class="walk-note" data-walk-fallback hidden>Rendering the lane is unavailable in this
        browser. {label} still reads in the list: every frame, its caption and its kind are written
        there, and the ticks above stand for those frames' depths.</p>
      <p class="walk-note">{label} is drawn, not surveyed: the distances are the artist's, and a
        frame is a depiction of a place rather than a record of standing in it.</p>
    </div>
    <button type="button" class="modal-close" data-walk-card-close aria-label="Close">{ICON_X}</button>
  </div>''')

rep('''        tiles.append(
            f'<a class="ig-tile" href="#{ident}" data-ig aria-label="{escape(it["title"])}: open in the roll">'
            f'<img src="{escape(it["src"])}" alt="{escape(it["alt"])}" {attrs} loading="lazy" />'
            f'<span class="ig-fig" aria-hidden="true">{n + 1:02d}</span>'
            f'<span class="ig-cap">{escape(label)}</span></a>')
        frames.append(
            f'<figure class="ig-frame" id="{ident}">'
            f'<img src="{escape(it["src"])}" alt="{escape(it["alt"])}" {attrs} />'
            f'<figcaption>{escape(it["title"])} - {escape(it["caption"])}</figcaption></figure>')''',
'''        # The wall is the photographs and nothing else. What a plate may claim — its block, and that it
        # is generated rather than taken — is said inside it, where you have to arrive to read it.
        tiles.append(
            f'<a class="ig-tile" href="#{ident}" data-ig '
            f'aria-label="{escape(label)}: open in the roll">'
            f'<img src="{escape(it["src"])}" alt="{escape(it["alt"])}" {attrs} loading="lazy" /></a>')
        frames.append(
            f'<figure class="ig-frame" id="{ident}">'
            f'<img src="{escape(it["src"])}" alt="{escape(it["alt"])}" {attrs} />'
            f'<figcaption>{escape(it["title"])} - {escape(it["caption"])}'
            f'<span class="when">{escape(label)}</span></figcaption></figure>')''')
print("done")

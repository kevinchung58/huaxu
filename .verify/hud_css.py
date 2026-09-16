"""CSS for an interface that shows no words, plus the tick rail that reads as the lane's own ruler.

The scrim stays because the icons sit on the viewport's edges, and the edges are where a phone puts its
notch; the text it was brightening is gone.
"""
import io

p = "css/site.css"
s = io.open(p, encoding="utf-8").read()


def rep(old, new):
    global s
    assert s.count(old) == 1, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, 1)
    io.open(p, "w", encoding="utf-8").write(s)
    print("  css:", old[:44].replace("\n", " "))


# the utility the folded display depends on
rep('''.walk-hud {\n  position: absolute;''',
'''/* Read by a screen reader, painted for nobody: an interface that is not allowed to wear words still
   has to announce what it is doing, and hiding a live region from both is how you trade an eyesight
   problem for a screen-reader one. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Icon chrome, and nothing else: the whole head-up display is buttons this wide.

   The hit area is a square even though the glyph inside is smaller, because a 14 px target on a phone
   is not a target. */
.walk-icon {
  display: inline-grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  padding: 0;
  border: 1px solid rgba(205, 214, 238, 0.34);
  border-radius: 6px;
  background: rgba(6, 11, 26, 0.6);
  color: var(--muted-navy);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: none;
}
.walk-icon:hover,
.walk-icon:focus-visible {
  border-color: var(--accent-bright);
  color: var(--accent-bright);
}
.walk-icon:focus-visible {
  outline: 2px solid var(--accent-bright);
  outline-offset: 2px;
}
.walk-icon svg {
  width: 1rem;
  height: 1rem;
}

.walk-hud {''')

rep('''/* A scrim, not boxes. The walls are lit now, which means white-on-anywhere stopped being a plan;
   raising the text further would only shout at the visitor. So the viewport's own edges fade to
   navy behind the readout, the way the reference's HUD sits on its scene. */''',
'''/* A scrim, not boxes. There is no readout left to brighten, but the icons still sit on the viewport's
   edges, and the edges are where a phone puts its notch and its home bar — so the fade stays for them,
   and for the day the lane is bright enough to swallow a 1 px border. */''')

# the eyebrow and the word-link are gone; the rail is ticks
rep('''.walk-home {
  justify-self: start;
  color: var(--muted-navy);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  opacity: 0.8;
}
.walk-home:hover,
.walk-home:focus-visible {
  color: var(--accent-bright);
  opacity: 1;
}
.walk-eyebrow {
  margin: 0 0 0.3rem;
  color: var(--gold);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.walk-stops {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  max-width: 58vw;
}
.walk-stop {
  padding: 0.22rem 0.6rem;
  border: 1px solid rgba(205, 214, 238, 0.3);
  border-radius: 999px;
  background: rgba(6, 11, 26, 0.55);
  color: var(--muted-navy);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}
.walk-stop:hover,
.walk-stop:focus-visible,
.walk-stop.is-here {
  border-color: var(--accent-bright);
  color: var(--accent-bright);
  background: rgba(242, 200, 142, 0.14);
}
.walk-status {
  margin: 0;
  color: var(--accent-bright);
  font-size: 0.84rem;
  font-weight: 600;
  text-align: right;
}
.walk-record {
  margin: 0.2rem 0 0;
  color: var(--muted-navy);
  font-size: 0.78rem;
  text-align: right;
}''',
'''.walk-pick {
  align-items: center;
}
/* The station rail as the lane's own ruler. Each tick's height is the depth it is standing at, from the
   data, so the row of them reads as the distance you are walking instead of as a row of words; the one
   you are at is the bright one. Nothing here is decoration — the profile is the geography. */
.walk-stops {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  max-width: 58vw;
  padding-bottom: 0.15rem;
}
.walk-stop {
  width: 1.15rem;
  height: 1.9rem;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: none;
  cursor: pointer;
  display: grid;
  place-items: end center;
}
.walk-stop::after {
  content: "";
  display: block;
  width: 2px;
  height: calc(0.42rem + var(--p, 0) * 0.86rem);
  background: rgba(205, 214, 238, 0.5);
  transition: background 200ms var(--ease), height 200ms var(--ease);
}
.walk-stop:hover,
.walk-stop:focus-visible {
  outline: 1px solid var(--accent-bright);
  outline-offset: 1px;
}
.walk-stop:hover::after,
.walk-stop:focus-visible::after {
  background: var(--accent-bright);
  height: calc(0.6rem + var(--p, 0) * 0.86rem);
}
.walk-stop.is-here::after {
  background: var(--gold);
  box-shadow: 0 0 0 1px rgba(6, 11, 26, 0.8);
}''')

rep('''.walk-tools button,
.walk-fov button {
  padding: 0.3rem 0.62rem;
  border: 1px solid rgba(205, 214, 238, 0.34);
  border-radius: 6px;
  background: rgba(6, 11, 26, 0.6);
  color: var(--muted-navy);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}
.walk-tools button:hover,
.walk-tools button:focus-visible,
.walk-fov button:hover,
.walk-fov button:focus-visible {
  border-color: var(--accent-bright);
  color: var(--accent-bright);
}
.walk-fov {''',
'''.walk-fov {''')

rep('''.walk-keys {
  margin: 0;
  font-size: 0.78rem;
  text-align: center;
  opacity: 0.86;
}''',
'''/* The one signal the display is allowed to give on its own: while something in front of you has a
   card to read, the note button carries a dot. No caption, no arrow, no word. */
.walk-info {
  position: relative;
}
.walk-info::after {
  content: "";
  position: absolute;
  top: -3px;
  right: -3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 1px rgba(6, 11, 26, 0.85);
  opacity: 0;
  transform: scale(0.55);
  transition: opacity 180ms var(--ease), transform 180ms var(--ease);
}
.walk.has-reach .walk-info::after {
  opacity: 1;
  transform: none;
}
.walk-keys {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.86;
}''')

# the album wall keeps its photographs and gives up its captions
rep('''.ig-fig {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  padding: 0.08rem 0.4rem;
  border-radius: 2px;
  background: rgba(10, 17, 40, 0.72);
  color: #fff;
  font-family: var(--sans);
  font-size: 0.7rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transform: translateY(-0.25rem);
  transition: opacity 220ms var(--ease), transform 220ms var(--ease);
}
.ig-tile:hover .ig-fig,
.ig-tile:focus-visible .ig-fig {
  opacity: 1;
  transform: none;
}
.ig-cap {
  display: block;
  padding: 0.5rem 0.6rem 0.6rem;
  color: #3b3a33;
  font-size: 0.8rem;
  line-height: 1.5;
}''',
'''/* The wall is the photographs: no index chip, no caption line under a tile. A plate's claims are read
   inside the plate, which is the only surface in this project you have to arrive at. */''')

rep('''  .ig-tile img,
  .ig-fig {
    transition: none;
  }''',
'''  .ig-tile img {
    transition: none;
  }''')

io.open(p, "w", encoding="utf-8").write(s)
print("css done")

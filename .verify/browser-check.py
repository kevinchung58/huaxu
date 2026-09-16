#!/usr/bin/env python3
"""Open the served page in a real browser and check the things jsdom structurally cannot see.

`node .verify/verify-walk.mjs` proves the document, the data and the paint list. It cannot prove that a
press *lands*: jsdom has no layout, no z-order and no hit-testing, so a strip of invisible glass over the
scene, a 4 px target and a link that navigates nowhere all pass there and fail in a hand. This is the
other half of the gate. It needs a browser, which this sandbox cannot download (the CDN resets TLS), so
run it on your own machine:

    python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/playwright install chromium
    python3 _gen_html.py && python3 -m http.server 8080 &      # the pages must be served, not file://
    .venv/bin/python .verify/browser-check.py [http://127.0.0.1:8080]

Written from scratch rather than wrapped in a helper script, because the point is to be readable: every
claim it makes is a claim you can check in these lines.
"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
fails = []


def check(name, cond, detail=""):
    print(("PASS  " if cond else "FAIL  ") + name + (("  — " + str(detail)) if detail else ""))
    if not cond:
        fails.append(name)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1024, "height": 768})
    noise, errors = [], []
    page.on("console", lambda m: noise.append(m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE + "/rooms.html")
    page.wait_for_timeout(1200)                      # boot, first paint, one idle pulse

    check("the lane renders without a page error", not errors, errors[:2])
    check("nothing in the console is an error or a warning", not noise, noise[:3])

    # The three bugs that survived 130 jsdom assertions, checked where they can actually be felt.
    hits = page.locator(".walk-hit")
    visible = [h for h in hits.all() if h.is_visible()]
    check("props are visible in the lane", len(visible) > 3, f"{len(visible)} on screen")
    blocked = []
    for h in visible:
        box = h.bounding_box()
        if not box:
            continue
        cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        top = page.evaluate(
            "([x, y]) => { const e = document.elementFromPoint(x, y);"
            " return e ? (e.className || e.tagName) : 'nothing'; }", [cx, cy])
        if "walk-hit" not in str(top):
            blocked.append((h.get_attribute("data-obj"), str(top)[:40]))
    check("every press box is the top-most thing at its own centre — no glass over the scene",
          not blocked, blocked[:4])

    small = [(h.get_attribute("data-obj"), h.bounding_box()) for h in visible if h.bounding_box()
             and (h.bounding_box()["width"] < 44 or h.bounding_box()["height"] < 44)]
    check("every press box is a fingertip (44 px) whatever the object's pixel size", not small, small[:4])

    first = visible[0]
    first.click(timeout=3000)
    page.wait_for_timeout(150)
    card_open = page.evaluate("() => !document.querySelector('[data-walk-card]').hidden")
    check("clicking a wall thing opens its plate", card_open, first.get_attribute("data-obj"))
    page.mouse.click(512, 380)                        # a tap on the scene puts it down
    page.wait_for_timeout(150)
    check("a tap on the scene closes the plate again",
          page.evaluate("() => document.querySelector('[data-walk-card]').hidden"))

    exit_link = page.locator("[data-walk-exit]")
    check("the way out is visible, sized and labelled",
          exit_link.is_visible() and exit_link.bounding_box()["width"] >= 40
          and bool(exit_link.get_attribute("aria-label")), exit_link.get_attribute("aria-label"))
    exit_link.click()
    page.wait_for_url(BASE + "/index.html", timeout=4000)
    check("and pressing it leaves the lane", page.url.endswith("/index.html"), page.url)

    page.goto(BASE + "/rooms.html")
    page.wait_for_timeout(1000)
    page.keyboard.press("Escape")
    check("Esc with nothing open leaves the lane too", page.url.endswith("/index.html"), page.url)

    page.screenshot(path=".verify/walk-last-frame.png")
    browser.close()

print(f"\n{len(fails)} failure(s)" + ("  " + ", ".join(fails) if fails else ""))
sys.exit(1 if fails else 0)

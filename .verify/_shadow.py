#!/usr/bin/env python3
"""_shadow.py -- can the lane's closure be split by rewriting text?

The remaining half of `TODO.md` P3 is "give the lane an interface": every one of its top-level names
would move into a namespace object or an export list, and every read of it would be rewritten. That
is only safe if a name means one thing in the programme. If a nested function, a parameter, a `catch`
or a block re-declares the same spelling, a textual rewrite rebinds the inner one and the scene loads
and draws the wrong thing -- a silent failure of exactly the kind this repository keeps paying for.

So this counts, for the programme's top-level names, where the same spelling is introduced *deeper*
in the same file (lane) or in another part (parts share one global lexical environment, so a lane
local shadows a part's top-level name inside that scope).

    python3 .verify/_shadow.py

Diagnostic, exit 0. The number it exists to produce is the last line: how many interface names a
text-only split would have to disambiguate without a scope analyser.
"""
import re
import sys

FILES = ["js/overlay.js", "js/chrome.js", "js/dot-game.js", "js/site.js"]
DECL = re.compile(r"^(\s*)(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)")
PAREN = re.compile(r"\(([^()]*)\)\s*=>")            # arrow parameters in a paren list
BARE = re.compile(r"(?:^|[\s(,])([A-Za-z_$][\w$]*)\s*=>")   # x => ...
FUNC = re.compile(r"function\s*[\w$]*\s*\(([^()]*)\)")       # named/anon parameters
IDENT = re.compile(r"^[A-Za-z_$][\w$]*$")


def names_in(group):
    out = set()
    for part in group.split(","):
        n = part.split("=")[0].strip().lstrip(".").strip()
        if IDENT.match(n or ""):
            out.add(n)
    return out


def main():
    files = {f: open(f, encoding="utf-8").read().split("\n") for f in FILES}

    # 1. each file's own top level: the indent its `const`/`function` statements sit at
    tops = {}     # (file, line) -> name
    for f, lines in files.items():
        decl = [(len(m.group(1)), m.group(2), i) for i, l in enumerate(lines)
                for m in [DECL.match(l)] if m]
        if not decl:
            continue
        base = min(ind for ind, _, _ in decl)
        for ind, name, i in decl:
            if ind == base:
                tops[(f, i)] = name
    top_names = set(tops.values())

    # 2. where each of those spellings is introduced deeper, or in another file
    shadow = {}
    for f, lines in files.items():
        for i, l in enumerate(lines):
            if (f, i) in tops:
                continue
            ind = len(l) - len(l.lstrip(" "))
            got = set()
            m = DECL.match(l)
            if m:
                got.add(m.group(2))
            for rx in (FUNC, PAREN):
                for mm in rx.finditer(l):
                    got |= names_in(mm.group(1))
            for mm in BARE.finditer(l):
                got.add(mm.group(1))
            for n in got & top_names:
                shadow.setdefault(n, set()).add((f, i))

    print(f"{len(FILES)} files, {sum(len(v) for v in files.values())} lines, "
          f"{len(top_names)} top-level names (the interface a split must design)")
    print(f"of those, introduced again as a local/parameter deeper in the same programme: "
          f"{len(shadow)}")
    for n, hits in sorted(shadow.items(), key=lambda kv: -len(kv[1]))[:10]:
        where = ", ".join(f"{f}:{i + 1}" for f, i in sorted(hits)[:3])
        print(f"  {n:12} {len(hits):4} times   first {where}")
    print(f"\na text-only split would have to disambiguate {len(shadow)} of {len(top_names)} names "
          f"with no parser; the other {len(top_names) - len(shadow)} would rewrite cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())

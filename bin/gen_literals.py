#!/usr/bin/env python3
"""Read named literal constants out of the site's generator, wherever the generator lives.

Round 78 split `_gen_html.py` into a 721-line entry point plus `gen/`. `bin/toronto_massing.py` had
its `--generator` default pinned to `_gen_html.py` and pulled `TOR_O` / `TOR_GRID` / `TOR_TOWERS`
out of it with `ast`; after the split that file no longer holds them and the tool raised
`Missing Toronto constants in /home/user/huaxu/_gen_html.py`. **Nothing failed**, because the tool
imports two optional packages and needs a downloaded archive before it can even start, so no gate
could reach it — which is exactly the class this repository keeps finding: a split that a text
reader does not notice.

So the lookup lives here, on stdlib only, and `.verify/verify-gen.mjs` calls it every round: a
constant that moves gets found, and a tool that would have broken gets caught before a round needs
it. Import this with `bin/` on `sys.path` (running `python3 bin/toronto_massing.py` puts it there).
"""
from __future__ import annotations

import ast
from pathlib import Path


def generator_files(root: Path) -> list[Path]:
    """The generator, entry point first, then its modules in a stable order."""
    root = Path(root)
    files = [root / "_gen_html.py"] if (root / "_gen_html.py").is_file() else []
    gen = root / "gen"
    if gen.is_dir():
        files += sorted(gen.glob("*.py"))
    return files


def literals_in(path: Path, wanted: set[str]) -> dict:
    """Every requested top-level literal assignment found in one file (missing keys simply absent)."""
    found: dict = {}
    tree = ast.parse(Path(path).read_text(encoding="utf-8"))
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in wanted:
                try:
                    found[target.id] = ast.literal_eval(node.value)
                except ValueError:
                    pass
    return found


def find_literals(root: Path, wanted: set[str]) -> tuple[Path, dict]:
    """The first generator file that holds all of `wanted`, with the values.

    Raises with the files actually searched: a tool that cannot find its data must say where it
    looked, not just that it failed.
    """
    searched: list[str] = []
    for path in generator_files(root):
        found = literals_in(path, wanted)
        if found.keys() == wanted:
            return path, found
        if found:
            searched.append(f"{path.name} (has {', '.join(sorted(found))})")
    raise ValueError(
        f"none of the generator files holds {', '.join(sorted(wanted))}; searched "
        + (", ".join(searched) if searched else "every file, none had any of them"))


if __name__ == "__main__":  # a one-line check, so this file can be run by hand
    import sys
    here = Path(__file__).resolve().parents[1]
    names = set(sys.argv[1:]) or {"TOR_O", "TOR_GRID", "TOR_TOWERS"}
    path, values = find_literals(here, names)
    print(f"{path.relative_to(here)} holds {', '.join(sorted(values))}")

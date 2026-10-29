#!/usr/bin/env python3
"""Split one load-bearing Python file into modules by NAME OWNERSHIP, not by line number.

Line numbers move; names do not. The spec names every top-level statement by what it defines, and
the splitter routes the statement to the module that owns that name. Anything unclaimed stays in the
entry point, in its original order, so the entry keeps doing what it did.

    python3 split_by_ownership.py SPEC.py

The spec is a Python file (it is only `exec`'d) defining:

    SRC      — the file to split (never written to)
    ENTRY    — where the trimmed entry point goes
    MODULES  — [{"path": ..., "doc": ..., "names": [...], "ranges": [["FIRST", "LAST"], ...]}, ...]
    ENTRY_HEAD — the entry's new header text (shebang, docstring); replaces nothing
    PACKAGE_DOC — the docstring for a fresh `<dir>/__init__.py`, if the spec wants one
               `ranges` claims every named statement from FIRST to LAST inclusive (a slice of the
               file that belongs to one module); `names` claims individual ones.
    SHIM     — {"old text": "new text"} applied to the entry only (a moved file's own paths)
    STDLIB   — {"name": "the import line"} for the modules it may import
    DROP     — names that are not globals at all (`__file__`)

It prints, per module, the imports it decided on and any name it could not resolve — and exits
non-zero on an unresolved name, because a split that guesses is a split that breaks at runtime.

Proven on this repository's generator (round 78): 7,484 lines → a 715-line entry plus six modules,
all 19 emitted pages byte-identical. See ../SKILL.md.
"""
import ast
import builtins
import os
import re
import sys


def _ids(target, out):
    """Every name an assignment target binds, tuple elements included.

    `A, B, C = f()` binds three names and has no `ast.Name` target of its own: a splitter that only
    reads `ast.Name` targets leaves it unowned, it lands in the entry point, and every module that
    imports A breaks at the first run.
    """
    if isinstance(target, ast.Name):
        out.append(target.id)
    elif isinstance(target, (ast.Tuple, ast.List)):
        for elt in target.elts:
            _ids(elt, out)
    elif isinstance(target, ast.Starred):
        _ids(target.value, out)
    return out


def name_of(node):
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
        return [node.name]
    if isinstance(node, ast.Assign):
        out = []
        for t in node.targets:
            _ids(t, out)
        return out
    if isinstance(node, ast.AnnAssign):
        return _ids(node.target, [])
    return []


def free_globals(text, drop):
    """Every name a module-level block resolves globally, minus what the block itself defines.

    `symtable` is the only checker that gets this right: `exec`, `eval` and the parser all disagree
    about what a nested comprehension or a `global` statement does to the symbol table.
    """
    import symtable
    top = symtable.symtable(text, "<module>", "exec")
    out, stack = set(), [top]
    while stack:
        t = stack.pop()
        stack.extend(t.get_children())
        for s in t.get_symbols():
            if s.is_global() and not s.is_assigned() and not s.is_imported():
                out.add(s.get_name())
    defined = {s.get_name() for s in top.get_symbols() if s.is_assigned() or s.is_imported()}
    return (out - defined - set(dir(builtins)) - set(drop))


def prune_imports(head, body):
    """Drop an import line whose bound names appear nowhere else — the split moves uses, not imports."""
    keep = []
    for line in head.split("\n"):
        if not line.startswith(("import ", "from ")):
            keep.append(line)
            continue
        # `import hashlib` has no " import " separator — splitting on it returned the whole line and
        # the import was pruned as unused. Take the names after `import ` either way.
        names_part = line.split(" import ", 1)[-1] if " import " in line else line[len("import "):]
        bound = [a.split(" as ")[-1].split(".")[0].strip() for a in names_part.split(",")]
        if bound == ["*"] or any(re.search(rf"\b{re.escape(b)}\b", body) for b in bound):
            keep.append(line)
    return "\n".join(keep)


def main(spec_path):
    spec = {}
    exec(compile(open(spec_path, encoding="utf-8").read(), spec_path, "exec"), spec)
    src, entry_path = spec["SRC"], spec["ENTRY"]
    MODULES, SHIM, STDLIB = spec["MODULES"], spec.get("SHIM", {}), spec.get("STDLIB", {})
    ENTRY_HEAD, PACKAGE_DOC = spec.get("ENTRY_HEAD", ""), spec.get("PACKAGE_DOC")
    DROP = spec.get("DROP", [])

    source = open(src, encoding="utf-8").read()
    lines = source.split("\n")
    tree = ast.parse(source)

    stmts, prev = [], 0
    for node in tree.body:
        stmts.append({"names": name_of(node), "start": node.lineno, "end": node.end_lineno,
                      "lead": "\n".join(lines[prev:node.lineno - 1]),
                      "body": "\n".join(lines[node.lineno - 1:node.end_lineno])})
        prev = node.end_lineno
    for st in stmts:
        st["name"] = st["names"][0] if st["names"] else None

    # The first statement's "lead" is the file's header (shebang, docstring, original imports). It
    # belongs to the file, not to whichever module happens to own the first statement: drop it, or
    # the entry keeps a stale shebang and the modules inherit imports nothing uses.
    if spec.get("CLEAR_FIRST_LEAD", True) and stmts:
        stmts[0]["lead"] = ""

    def index(nm):
        return next(i for i, st in enumerate(stmts) if st["name"] == nm)

    owner = {}
    for mod in MODULES:
        for nm in mod.get("names", []):
            owner[nm] = mod["path"]
        for first, last in mod.get("ranges", []):
            for st in stmts[index(first):index(last)]:
                for nm in st["names"]:
                    owner[nm] = mod["path"]

    # Fallback for targets `_ids` still cannot read (subscripts, attributes): route the statement by
    # whichever name on its left-hand side has an owner.
    forced = {}
    for st in stmts:
        if st["names"] or " = " not in st["body"].split("\n")[0]:
            continue
        lhs = st["body"].split("\n")[0].split(" = ")[0]
        for tok in re.findall(r"[A-Za-z_][A-Za-z0-9_]*", lhs):
            if tok in owner:
                forced[st["start"]] = owner[tok]
                break

    buckets = {m["path"]: [] for m in MODULES}
    entry = []
    for st in stmts:
        path = owner.get(st["name"]) or forced.get(st["start"])
        (entry if path is None else buckets[path]).append(st)

    def render(lst):
        # The lead is the comment block above a statement. It must keep its own newline: gluing it
        # to the statement turns `# note` into a comment on the next line's indentation.
        return "\n".join(((st["lead"] + "\n") if st["lead"] else "") + st["body"] for st in lst)

    known = set(owner)

    def resolve(text, me):
        free = free_globals(text, DROP)
        imports, unknown, cross = [], [], {}
        for nm in sorted(free):
            if nm in STDLIB:
                imports.append(STDLIB[nm])
            elif nm in known and owner[nm] != me:
                cross.setdefault(owner[nm], []).append(nm)
            else:
                unknown.append(nm)
        for dep, names in sorted(cross.items()):
            imports.append(f"from {dep[:-3].replace('/', '.')} import " + ", ".join(names))
        return imports, unknown

    texts = {m["path"]: render(buckets[m["path"]]) for m in MODULES}
    failed = False
    for m in MODULES:
        imports, unknown = resolve(texts[m["path"]], m["path"])
        head = '"""' + m["doc"].strip() + '\n"""\n' + "\n".join(imports)
        head = prune_imports(head, texts[m["path"]])
        body = texts[m["path"]].strip("\n")
        for old, new in SHIM.items():
            body = body.replace(old, new)
        texts[m["path"]] = head + "\n" + body + "\n"
        print(f"{m['path']}: imports={len(imports)} unresolved={unknown}")
        failed = failed or bool(unknown)

    entry_text = render(entry)
    imports, unknown = resolve(entry_text, entry_path)
    head = "\n".join(imports)
    head = prune_imports(head, entry_text)
    for old, new in SHIM.items():
        head = head.replace(old, new)
        entry_text = entry_text.replace(old, new)
    print(f"{entry_path}: imports={len(imports)} unresolved={unknown}")
    failed = failed or bool(unknown)
    if failed:
        raise SystemExit("unresolved names — fix the spec, do not ship a guess")

    for m in MODULES:
        path = m["path"]
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        open(path, "w", encoding="utf-8").write(texts[path])
        init = os.path.join(os.path.dirname(path), "__init__.py")
        if PACKAGE_DOC and not os.path.exists(init):
            open(init, "w").write('"""' + PACKAGE_DOC.strip() + '"""\n')
    open(entry_path, "w", encoding="utf-8").write(
        (ENTRY_HEAD.strip("\n") + "\n" if ENTRY_HEAD else "") + head + "\n\n"
        + entry_text.strip("\n") + "\n")
    print(f"wrote {len(MODULES) + 1} files")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "spec.py")

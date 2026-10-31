#!/usr/bin/env python3
"""gate-all.py -- run the whole gate battery, in the order TODO.md section 2.3 lists it.

The list of gates lives in exactly one place: the fenced block under `### 2.3` in TODO.md. This
script *reads that list* rather than keeping its own copy, for the reason the repository keeps
relearning: two copies of one list drift, and the copy nobody runs is the one that is wrong. Here
that drift has a name -- "a gate that is not on the list does not exist", because nobody runs it --
so the script also checks the list against the disk in both directions:

  * a `verify-*` gate on disk that no line of the list runs   -> DRIFT (it would never run again)
  * a line that names a gate file that does not exist        -> DRIFT (it would fail on a typo)

Either one exits 2 before anything is run, which is the point: the list is the gate.

Every command is executed through `sh bin/gate`, which restores `node_modules` and
`/tmp/al2023/lib`, exports `LD_LIBRARY_PATH`, refuses the two exclusive gates on a busy box, and
starts and stops the page server for the HTTP gates. The runner adds: one gate at a time (never in
parallel -- half this list measures a machine, and two browsers on one box measure each other),
a duration, the gate's own last line, and a failure tail.

    python3 bin/gate-all.py                 # everything, in list order
    python3 bin/gate-all.py --list          # what would run
    python3 bin/gate-all.py --check         # only the drift check (fast; also what a test runs)
    python3 bin/gate-all.py --only=walk,box # substring filter, repeatable
    python3 bin/gate-all.py --skip=collision
    python3 bin/gate-all.py --stop          # stop at the first failure
"""
import argparse
import glob
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TODO = os.path.join(ROOT, "TODO.md")
SECTION = "### 2.3"
# `sh bin/preview` is on the list because the block documents a session, not because it terminates:
# a server does not exit, so running it here would hang the runner on line 1. Every gate that needs
# the server gets one from `sh bin/gate`, which starts it and stops it again.
def LONG_RUNNING(line):
    return "bin/preview" in line


GATE_RE = re.compile(r"(?:\.verify/)?(?:verify-[a-z0-9-]+\.(?:mjs|cjs))|(?:bin/verify-three\.mjs)")


def commands(text):
    """The runnable lines of the gate block, in order, verbatim.

    Lines starting with `#` are the block's own section markers and prose; they are not commands.
    A line's trailing `#  comment` is left in place -- the shell strips it, and stripping it here
    would mean guessing where a comment starts inside a command too.
    """
    lines = text.split("\n")
    try:
        start = next(i for i, l in enumerate(lines) if l.startswith(SECTION))
    except StopIteration:
        sys.exit(f"gate-all: {TODO} has no `{SECTION}` section")
    out, fence = [], None
    for l in lines[start + 1:]:
        if l.startswith("### ") and fence is None:
            break
        if l.lstrip().startswith("```"):
            if fence is None:
                fence = True          # the first fence after §2.3 is the battery
                continue
            break                     # ... and the block ends at the next fence
        if fence and l.strip() and not l.strip().startswith("#"):
            out.append(l.strip())
    return out


def gates_in(line):
    return set(GATE_RE.findall(line))


def disk_gates():
    found = set()
    for p in glob.glob(os.path.join(ROOT, ".verify", "verify-*.mjs")) + \
             glob.glob(os.path.join(ROOT, ".verify", "verify-*.cjs")) + \
             glob.glob(os.path.join(ROOT, "bin", "verify-*.mjs")):
        found.add(os.path.relpath(p, ROOT).replace(os.sep, "/"))
    return found


def check(cmds):
    """The list against the disk, both ways. Returns a list of complaints (empty == fine)."""
    listed, missing = set(), []
    for c in cmds:
        for name in gates_in(c):
            listed.add(name)
            if not os.path.exists(os.path.join(ROOT, name)):
                missing.append(c)
    on_disk = disk_gates()
    # `.verify/verify-x.mjs` and `verify-x.mjs` are the same gate: compare by basename.
    listed_names = {os.path.basename(n) for n in listed}
    unlisted = sorted(n for n in on_disk if os.path.basename(n) not in listed_names)
    problems = []
    for c in missing:
        for name in sorted(gates_in(c)):
            if not os.path.exists(os.path.join(ROOT, name)):
                problems.append(f"listed but not on disk: {name}   (in: {c})")
    for name in unlisted:
        problems.append(f"on disk but not in the list: {name}   (a gate nobody runs does not exist)")
    return problems, sorted(listed_names), sorted(os.path.basename(n) for n in on_disk)


def main(argv):
    ap = argparse.ArgumentParser(add_help=True, description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--list", action="store_true", help="print the battery and exit")
    ap.add_argument("--check", action="store_true", help="only check the list against the disk")
    ap.add_argument("--only", action="append", default=[], help="run lines containing this substring")
    ap.add_argument("--skip", action="append", default=[], help="skip lines containing this substring")
    ap.add_argument("--stop", action="store_true", help="stop at the first failure")
    ap.add_argument("--timeout", type=int, default=5400, help="seconds per gate (default 5400)")
    ap.add_argument("--tail", type=int, default=25, help="lines of a failing gate to print")
    args = ap.parse_args(argv)
    # `--only=walk,box` -- a filter is a list, and a filter that matches nothing must not look
    # like a green run.
    for name in ("only", "skip"):
        setattr(args, name, [p for v in getattr(args, name) for p in v.split(",") if p])

    if not os.path.exists(TODO):
        sys.exit(f"gate-all: no {TODO}")
    cmds = commands(open(TODO, encoding="utf-8").read())
    if not cmds:
        sys.exit("gate-all: section 2.3 has no commands -- did the fence move?")

    problems, listed, on_disk = check(cmds)
    print(f"list: {len(cmds)} commands, {len(listed)} gates listed, {len(on_disk)} on disk")
    for p in problems:
        print(f"DRIFT {p}")
    if problems:
        return 2
    if args.check:
        return 0

    def wanted(c):
        if LONG_RUNNING(c):
            return False
        if args.only and not any(s in c for s in args.only):
            return False
        return not any(s in c for s in args.skip)

    run = [c for c in cmds if wanted(c)]
    skipped = [c for c in cmds if LONG_RUNNING(c)]
    if not run:
        print("nothing matched the filter -- a battery that runs zero gates is not a green run")
        return 2
    for c in skipped:
        print(f"skipping (does not exit; bin/gate starts a server when a gate needs one): {c}")
    if args.list:
        for i, c in enumerate(run, 1):
            print(f"{i:2}. {c}")
        return 0

    results, t_all = [], time.time()
    for i, c in enumerate(run, 1):
        print(f"\n▶ [{i}/{len(run)}] {c}", flush=True)
        t0 = time.time()
        try:
            # The browser section of TODO already writes `sh bin/gate node ...`; do not wrap twice.
            body = c[len("sh bin/gate "):] if c.startswith("sh bin/gate ") else c
            r = subprocess.run(["sh", "-c", "sh bin/gate " + body], cwd=ROOT,
                               stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                               text=True, timeout=args.timeout)
            code, out = r.returncode, r.stdout
        except subprocess.TimeoutExpired as e:
            code = "timeout"
            out = (e.stdout or "") if isinstance(e.stdout, str) else ""
        dt = time.time() - t0
        lines = [l for l in out.split("\n") if l.strip()]
        last = lines[-1] if lines else "(no output)"
        ok = code == 0
        results.append((ok, dt, c, last, code))
        print(f"{'PASS' if ok else 'FAIL'} {dt:7.1f}s  {last}", flush=True)
        if not ok:
            print(f"  exit {code}; last {args.tail} lines:", flush=True)
            for l in lines[-args.tail:]:
                print("  | " + l, flush=True)
            if args.stop:
                break

    dt_all = time.time() - t_all
    bad = [r for r in results if not r[0]]
    print(f"\n{'=' * 72}\n{len(results) - len(bad)}/{len(results)} passed in {dt_all / 60:.1f} min")
    for ok, dt, c, last, code in results:
        print(f"  {'PASS' if ok else 'FAIL'} {dt:7.1f}s  {c}")
    if bad:
        print("\nre-run one of these with:\n")
        for _, _, c, _, _ in bad:
            body = c[len("sh bin/gate "):] if c.startswith("sh bin/gate ") else c
            print(f"  sh bin/gate {body}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

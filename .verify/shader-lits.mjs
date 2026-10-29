#!/usr/bin/env node
/*
 * The shader-literal gate. Run from the repository root: `node .verify/shader-lits.mjs`.
 *
 * Round 69 — a backtick in a GLSL comment does not break the file, it breaks the *scene*.
 *
 * The shaders in js/scene3d.js are template literals. A stray backtick inside one of their
 * comments ends the literal early; what follows can still parse (``x`…` `` reads as a tagged
 * template), so `node --check` passes, the file imports, every string match downstream passes —
 * and the browser hands the GPU half a program. Three.js throws at mount, js/site.js prints one
 * SyntaxError, and every screenshot afterwards is an empty background with a HUD on it. It cost
 * two round-69 measurement runs before the frame was recognised as "not the scene".
 *
 * So: read the file as text (never import it — the broken file may not import), extract every
 * template literal the way the parser would, keep the six that are shader programs, and require
 * each to be brace-balanced and to end on its closing brace. A truncated program fails here.
 *
 * The gate proves itself first: a synthetic source with the exact round-69 defect must be caught
 * by the same function. A gate that only ever passes has measured nothing.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const ROOT = process.cwd();

/* Every template literal in a JS source, body only, with `${…}` collapsed to `0` (the shaders have
   no interpolation, but the rest of the file does and must not be misread). Written as a scan
   rather than a regex because the whole point is to find the literal a regex cannot. */
export function templateBodies(source) {
  const bodies = [];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] !== "`") continue;
    let j = i + 1;
    let body = "";
    while (j < source.length && source[j] !== "`") {
      if (source[j] === "\\") { body += source[j + 1] ?? ""; j += 2; continue; }
      if (source[j] === "$" && source[j + 1] === "{") {
        let depth = 1;
        j += 2;
        while (j < source.length && depth > 0) {
          if (source[j] === "{") depth += 1;
          else if (source[j] === "}") depth -= 1;
          j += 1;
        }
        body += "0";
        continue;
      }
      body += source[j];
      j += 1;
    }
    bodies.push(body);
    i = j;
  }
  return bodies;
}

export function shaderPrograms(source) {
  return templateBodies(source).filter(
    (b) => /void\s+main\s*\(/.test(b) && /gl_(FragColor|Position)/.test(b));
}

export function problems(source) {
  const found = [];
  const programs = shaderPrograms(source);
  if (programs.length !== 6) {
    found.push(`expected 6 whole shader programs, found ${programs.length} — a stray backtick merges or splits one`);
  }
  for (const body of programs) {
    /* The decisive test is the comment, not the braces. A backtick inside a GLSL comment splits
       the literal; the half *after* the stray backtick begins in the middle of that comment, so it
       carries a `*/` with no `/*` before it. That is true wherever in the comment the backtick sat,
       and it is false for every sane program, which is why it is the check rather than brace count
       (the surviving half usually still closes its braces and still ends on `}`). */
    let comment = 0;
    for (let k = 0; k < body.length; k += 1) {
      if (body.startsWith("/*", k)) { comment += 1; k += 1; continue; }
      if (body.startsWith("*/", k)) {
        comment -= 1; k += 1;
        if (comment < 0) { found.push("a shader program opens with a comment terminator — the literal was cut short"); break; }
      }
    }
    if (comment > 0) found.push("a shader program has an unterminated comment — the literal was cut short");
    let depth = 0;
    for (const ch of body) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    if (depth !== 0) found.push("a shader program has unbalanced braces — the literal was cut short");
    if (!body.trimEnd().endsWith("}")) {
      found.push(`a shader program ends on ${JSON.stringify(body.trimEnd().slice(-24))} instead of its closing brace`);
    }
  }
  return found;
}

// ── the self-test: the exact defect that cost the two runs, on a synthetic file ────────────
const good = "x`uniform float u; /* note */ void main(){ float mass=0.5; gl_FragColor=vec4(mass*0.8); }`";
const broken = "x`uniform float u; /* put `mass` here */ void main(){ float mass=0.5; gl_FragColor=vec4(mass*0.8); }`";
assert.deepEqual(problems(good.repeat(6)), [], "the scanner must accept six whole programs");
assert.ok(problems(broken.repeat(6)).length > 0, "the scanner must catch a backtick inside a GLSL comment");

// ── the real file ───────────────────────────────────────────────────────────────────────────
const file = path.join(ROOT, "js/scene3d.js");
const source = fs.readFileSync(file, "utf8");
const found = problems(source);
if (found.length) {
  for (const line of found) console.log(`FAIL  js/scene3d.js: ${line}`);
  console.log("FAIL  shader literals: a backtick in a GLSL comment ends the template literal and the scene with it");
  process.exit(1);
}
console.log(`PASS  shader literals: ${shaderPrograms(source).length} whole programs, brace-balanced, no truncation`);

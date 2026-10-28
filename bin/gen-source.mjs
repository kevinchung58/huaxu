/* bin/gen-source.mjs — the generator's source as one string, for the gates that read it.

   Round 78 split `_gen_html.py` (7,484 lines) into `gen/`: site chrome, content, the image
   registry, the world builders, the district records and the renderers. Three gates were reading
   the one file as text (`verify-csslive`, `verify-walk`, `bin/verify-three`), and a gate that reads
   only the entry point would quietly stop seeing most of the generator — the exact failure mode
   this repository keeps finding. So the file list lives here once, sorted, and the entry point is
   included so a gate can still assert on the file it runs. */
import fs from "node:fs";
import path from "node:path";

export function genSource(root = ".") {
  const files = ["_gen_html.py", ...fs.readdirSync(path.join(root, "gen"))
    .filter((f) => f.endsWith(".py")).sort().map((f) => `gen/${f}`)];
  return files.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
}

export function genFiles(root = ".") {
  return ["_gen_html.py", ...fs.readdirSync(path.join(root, "gen"))
    .filter((f) => f.endsWith(".py")).sort().map((f) => `gen/${f}`)];
}

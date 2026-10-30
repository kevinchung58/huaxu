/* Walkable pages are the generated pages that actually carry a lane. Gates share this discovery
   instead of maintaining separate lists that can silently omit a newly generated scene. */
const fs = require("node:fs");
const path = require("node:path");

const walkPages = (root = path.resolve(__dirname, "..")) => fs.readdirSync(root)
  .filter((file) => file.endsWith(".html") &&
    fs.readFileSync(path.join(root, file), "utf8").includes('class="walk"'))
  .sort();

module.exports = { walkPages };

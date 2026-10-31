/* site-sources (CommonJS) -- the same list as `bin/site-sources.mjs`, for the jsdom tests and the
   `.cjs` gates, which cannot `import` an ES module. One JSON file backs both. */
const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..");

const siteFiles = () => JSON.parse(fs.readFileSync(path.join(HERE, "site-sources.json"), "utf8"));
const siteText = (root = ROOT) => siteFiles().map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n");

module.exports = { siteFiles, siteText };

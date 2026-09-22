/* Verify every <script src> / <link href> in every HTML page resolves on disk,
   and that profile/onboarding load AFTER their dependencies. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pages = ["index.html", "instructions.html", "exam.html", "result.html",
               "practice.html", "practice-exam.html", "profile.html"];

let failures = 0;
function check(label, cond, detail) {
  if (cond) console.log("  PASS  " + label);
  else { failures++; console.log("  FAIL  " + label + (detail ? "  -> " + detail : "")); }
}

console.log("\n=== asset references resolve on disk ===");
pages.forEach((page) => {
  const full = path.join(root, page);
  if (!fs.existsSync(full)) { check(page + " exists", false); return; }
  const html = fs.readFileSync(full, "utf8");

  const refs = [];
  const re = /<(?:script|link)[^>]*?(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) refs.push(m[1]);

  const local = refs.filter((r) => !/^https?:/.test(r));
  const missing = local.filter((r) => !fs.existsSync(path.join(root, r)));

  check(page + " (" + local.length + " local refs)", missing.length === 0,
    "missing: " + missing.join(", "));

  const deadData = local.filter((r) => /^data\/.*\.js$/.test(r) === false ? false : true);
  return void deadData;
});

console.log("\n=== script load order (deps before dependents) ===");
const deps = {
  "js/profile.js": ["js/config.js", "js/manifest.js", "js/storage.js"],
  "js/onboarding.js": ["js/profile.js"],
};
["index.html", "instructions.html", "exam.html", "result.html",
 "practice.html", "practice-exam.html", "profile.html"].forEach((page) => {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const order = [];
  const re = /<script src="([^"]+)"><\/script>/g;
  let m;
  while ((m = re.exec(html))) order.push(m[1]);

  const problems = [];
  Object.keys(deps).forEach((script) => {
    if (order.indexOf(script) === -1) return; // page may not use it
    deps[script].forEach((d) => {
      if (order.indexOf(d) === -1) problems.push(script + " needs " + d + " (absent)");
      else if (order.indexOf(d) > order.indexOf(script)) problems.push(script + " loads before " + d);
    });
  });
  check(page + " order", problems.length === 0, problems.join("; "));
});

console.log("\n=== no dead data/*.js references remain (2010-2014,2016,2018,2019,2020) ===");
const deadNames = ["2010", "2011", "2012", "2013", "2014", "2016", "2018", "2019", "2020"]
  .map((y) => "data/" + y + ".js");
pages.forEach((page) => {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const found = deadNames.filter((d) => html.indexOf('"' + d + '"') !== -1);
  check(page + " clean", found.length === 0, "still references: " + found.join(", "));
});

console.log("\n=== profile.html wires everything the page script needs ===");
const ph = fs.readFileSync(path.join(root, "profile.html"), "utf8");
["js/profile.js", "js/onboarding.js", "js/profile-page.js", "data/topics.js",
 "js/scoring.js", "css/profile.css"].forEach((r) => {
  check("profile.html includes " + r, ph.indexOf(r) !== -1);
});

console.log(failures === 0 ? "\nALL PAGES OK\n" : `\n${failures} PAGE CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);

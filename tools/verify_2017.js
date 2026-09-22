global.window = {};
require("../data/2017_ce1.js");
require("../data/2017_ce2.js");

const fs = require("fs");
const path = require("path");
const P = window.GATE_PAPERS;
const root = path.join(__dirname, "..");

let problems = 0;

for (const k of ["2017-CE1", "2017-CE2"]) {
  const p = P[k];
  if (!p) { console.log(k, "MISSING from registry"); problems++; continue; }
  const ids = new Set(p.questions.map(q => q.id));
  const missImg = p.questions.filter(q => !fs.existsSync(path.join(root, q.image)));
  const badType = p.questions.filter(q => !["MCQ", "MSQ", "NAT"].includes(q.type));
  const noAnswer = p.questions.filter(
    q => q.correctAnswer === undefined && !q.isMTA && !q.ranges);
  const marksSum = p.questions.reduce((a, q) => a + q.marks, 0);

  console.log(k,
    "qs=" + p.questions.length,
    "uniqIds=" + ids.size,
    "missingImgs=" + missImg.length,
    "badType=" + badType.length,
    "noAnswer=" + noAnswer.length,
    "marksSum=" + marksSum);
  if (missImg.length) { console.log("  missing image ex:", missImg.slice(0, 3).map(q => q.image)); problems++; }
  if (ids.size !== p.questions.length) { console.log("  DUPLICATE ids"); problems++; }
  if (noAnswer.length) { console.log("  unanswered:", noAnswer.map(q => q.id)); problems++; }
}

console.log("aliases:",
  ["2017-1", "2017_ce1", "2017-2", "2017_ce2"]
    .map(a => a + "=" + (P[a] ? "ok" : "MISSING")).join(" "));

const src = fs.readFileSync(path.join(root, "js/manifest.js"), "utf8");
const years = [...src.matchAll(/year: "([^"]+)"/g)].map(m => m[1]);
const missing = years.filter(y => !P[y]);
console.log("manifest entries:", years.length);
console.log("manifest entries with NO data file:", missing.join(", ") || "(none)");
console.log(problems ? "PROBLEMS: " + problems : "ALL CHECKS PASSED");

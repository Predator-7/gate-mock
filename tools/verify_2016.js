global.window = {};
require("../data/2016_ce1.js");
require("../data/2016_ce2.js");

const fs = require("fs");
const path = require("path");
const P = window.GATE_PAPERS;
const root = path.join(__dirname, "..");

let problems = 0;

for (const k of ["2016-CE1", "2016-CE2"]) {
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
  ["2016", "2016-1", "2016_ce1", "2016-2", "2016_ce2"]
    .map(a => a + "=" + (P[a] ? "ok" : "MISSING")).join(" "));

console.log(problems ? "PROBLEMS: " + problems : "ALL CHECKS PASSED");
process.exit(problems === 0 ? 0 : 1);

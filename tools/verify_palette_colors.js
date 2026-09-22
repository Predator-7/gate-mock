const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log("  PASS  " + label);
  } else {
    failures++;
    console.log("  FAIL  " + label + (detail ? " -> " + detail : ""));
  }
}

console.log("\n=== 1. CSS Palette Color Variables (css/base.css) ===");
const baseCss = fs.readFileSync(path.join(root, 'css', 'base.css'), 'utf8');

check("base.css defines --palette-marked-review as #8e24aa",
  /--palette-marked-review:\s*#8e24aa/i.test(baseCss));
check("base.css defines --palette-answered-marked as #8e24aa (not green)",
  /--palette-answered-marked:\s*#8e24aa/i.test(baseCss) && !/--palette-answered-marked:\s*var\(--green\)/i.test(baseCss));
check("base.css styles .palette-marked-review with border-radius: 50%",
  /\.palette-marked-review[\s\S]*?border-radius:\s*50%/i.test(baseCss));
check("base.css styles .palette-answered-marked with border-radius: 50%",
  /\.palette-answered-marked[\s\S]*?border-radius:\s*50%/i.test(baseCss));
check("base.css adds ::after green dot for answered & marked",
  /\.palette-answered-marked::after[\s\S]*?background:\s*#4caf50/i.test(baseCss));

console.log("\n=== 2. Exam CSS Styling (css/exam.css) ===");
const examCss = fs.readFileSync(path.join(root, 'css', 'exam.css'), 'utf8');

check("exam.css styles #mark-review-btn with purple gradient",
  /#mark-review-btn[\s\S]*?background:\s*linear-gradient[^{}]*#8e24aa/i.test(examCss));
check("exam.css styles #save-next-btn with green gradient",
  /#save-next-btn[\s\S]*?background:\s*linear-gradient[^{}]*#2e7d32/i.test(examCss));
check("exam.css styles .palette-cell.palette-marked-review with border-radius: 50%",
  /\.palette-cell\.palette-marked-review[\s\S]*?border-radius:\s*50%/i.test(examCss));
check("exam.css styles .palette-cell.palette-answered-marked with border-radius: 50%",
  /\.palette-cell\.palette-answered-marked[\s\S]*?border-radius:\s*50%/i.test(examCss));
check("exam.css styles .palette-cell.palette-answered-marked::after green dot",
  /\.palette-cell\.palette-answered-marked::after[\s\S]*?background:\s*#4caf50/i.test(examCss));
check("exam.css styles .legend-count-badge",
  /\.legend-count-badge\s*\{/.test(examCss));

console.log("\n=== 3. HTML Legend Count Elements (exam.html & instructions.html) ===");
const examHtml = fs.readFileSync(path.join(root, 'exam.html'), 'utf8');
const instHtml = fs.readFileSync(path.join(root, 'instructions.html'), 'utf8');

const requiredBadges = [
  "count-not-visited",
  "count-not-answered",
  "count-answered",
  "count-marked-review",
  "count-answered-marked"
];
requiredBadges.forEach(id => {
  check("exam.html contains id=\"" + id + "\"", examHtml.includes(`id="${id}"`));
});

const legendClasses = [
  "palette-not-visited",
  "palette-not-answered",
  "palette-answered",
  "palette-marked-review",
  "palette-answered-marked"
];
legendClasses.forEach(cls => {
  check("instructions.html contains swatch ." + cls, instHtml.includes(cls));
  check("exam.html contains swatch ." + cls, examHtml.includes(cls));
});

console.log("\n=== 4. State & Transition Logic (js/state.js & js/config.js) ===");
// Mock window environment
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

require('../js/config.js');
require('../js/storage.js');
require('../data/2015.js');
require('../js/state.js');

const paper = window.GATE_PAPERS["2015"];
check("2015 paper loaded", !!paper && paper.questions.length > 0);

window.GateState.init(paper, "2015");
const q1 = paper.questions[0];
const q2 = paper.questions[1];

check("Q2 initially NOT_VISITED", window.GateState.getPaletteState(q2.id) === "not-visited");
check("Q1 initially NOT_ANSWERED (visited current)", window.GateState.getPaletteState(q1.id) === "not-answered");

// Mark Q1 for review
window.GateState.markForReview(q1.id);
check("Q1 becomes MARKED_REVIEW when marked without answer", window.GateState.getPaletteState(q1.id) === "marked-review");

// Answer Q1
window.GateState.setResponse(q1.id, "B");
check("Q1 becomes ANSWERED_MARKED when answered and marked for review", window.GateState.getPaletteState(q1.id) === "answered-marked");

// Unmark Q1 for review (e.g. on Save & Next)
window.GateState.unmarkForReview(q1.id);
check("Q1 becomes ANSWERED when unmarking review", window.GateState.getPaletteState(q1.id) === "answered");

// Clear response on Q1
window.GateState.clearResponse(q1.id);
check("Q1 becomes NOT_ANSWERED when response cleared", window.GateState.getPaletteState(q1.id) === "not-answered");

console.log(failures === 0 ? "\nALL PALETTE & COLOR VERIFICATIONS PASSED!\n" : `\n${failures} CHECK(S) FAILED!\n`);
process.exit(failures === 0 ? 0 : 1);

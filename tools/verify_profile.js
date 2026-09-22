/* Verification harness for the profile/progress feature.
   Runs the REAL js/profile.js + js/scoring.js against a fake localStorage,
   simulating: onboarding -> mock submit -> practice session -> mastery/stats. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

/* ── fake browser ── */
const store = {};
const sandbox = {
  console,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  document: { addEventListener() {}, querySelector() { return null; }, readyState: "complete" },
  window: {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
function load(rel) {
  vm.runInContext(fs.readFileSync(path.join(root, rel), "utf8"), ctx, { filename: rel });
}

/* real scripts, in page order */
["js/config.js", "js/manifest.js", "js/utils.js", "js/storage.js",
 "js/scoring.js", "data/topics.js", "data/2015.js", "data/2017_ce1.js",
 "js/profile.js"].forEach(load);

const { GateProfile, GateScoring, GATE_PAPERS, GATE_TOPICS, GATE_MANIFEST } = sandbox;

let failures = 0;
function check(label, cond, detail) {
  if (cond) { console.log("  PASS  " + label); }
  else { failures++; console.log("  FAIL  " + label + (detail ? "  -> " + detail : "")); }
}

console.log("\n=== 1. fresh profile ===");
check("not onboarded initially", GateProfile.isOnboarded() === false);
check("export works with no data", GateProfile.exportData().mockHistory.length === 0);

console.log("\n=== 2. onboarding ===");
const p = GateProfile.save({ name: "Arjun Sharma" });
check("onboarded after save", GateProfile.isOnboarded() === true);
check("createdAt stamped", typeof p.createdAt === "number");
check("name persisted", GateProfile.load().name === "Arjun Sharma");

console.log("\n=== 3. mock submit (real scoring path) ===");
const year = "2015";
const paper = GATE_PAPERS[year];
check("2015 paper loaded", !!paper && Array.isArray(paper.questions));

/* answer the first 12 questions correctly via the real scorer's contract */
const responses = {};
paper.questions.slice(0, 12).forEach((q) => {
  if (q.isMTA || q.correctAnswer === "MTA") return;
  if (q.type === "MCQ") {
    const ans = Array.isArray(q.correctAnswer) ? q.correctAnswer[0]
      : String(q.correctAnswer).split(" OR ")[0].trim();
    responses[q.id] = { selected: ans };
  } else if (q.type === "MSQ") {
    responses[q.id] = { selected: q.correctAnswer.slice() };
  } else {
    const v = (q.ranges && q.ranges[0]) ? q.ranges[0][0] : q.correctAnswer;
    responses[q.id] = { value: v };
  }
});

const result = GateScoring.scorePaper(paper, responses);
result.year = year;
result.maxScore = (paper.sections || []).reduce((s, x) => s + (x.totalMarks || 0), 0) || 100;
result.submittedAt = Date.now();

sandbox.GateStorage.saveResult(year, result);
GateProfile.recordMockResult(year, result);

const mocks = GateProfile.loadMockHistory();
check("one mock recorded", mocks.length === 1, "got " + mocks.length);
check("mock verdict counts match scorer",
  mocks[0].correct === result.totalCorrect && mocks[0].wrong === result.totalWrong,
  `hist ${mocks[0].correct}/${mocks[0].wrong} vs score ${result.totalCorrect}/${result.totalWrong}`);
check("maxScore captured from paper sections", result.maxScore === 100, "got " + result.maxScore);
check("label resolved from manifest", mocks[0].label === "GATE CE 2015", "got " + mocks[0].label);

console.log("\n=== 4. duplicate submit guard ===");
GateProfile.recordMockResult(year, result);
check("same attempt not double-recorded", GateProfile.loadMockHistory().length === 1,
  "got " + GateProfile.loadMockHistory().length);

console.log("\n=== 5. second attempt on same paper is retained ===");
const second = Object.assign({}, result, { submittedAt: Date.now() + 1000 });
GateProfile.recordMockResult(year, second);
check("repeat attempt kept", GateProfile.loadMockHistory().filter((m) => m.year === year).length === 2);

console.log("\n=== 6. practice session ===");
GateProfile.savePracticeSession({
  type: "practice",
  topics: [{ topic: "geotechnical", correct: 4, wrong: 1, skipped: 0, total: 5 }],
  correct: 4, wrong: 1, skipped: 0, score: 7, total: 5, completedAt: Date.now()
});
const ph = GateProfile.loadPracticeHistory();
check("session saved", ph.length === 1);
check("string id assigned", typeof ph[0].id === "string" && ph[0].id.indexOf("practice-") === 0, "got " + ph[0].id);

console.log("\n=== 7. topic mastery ===");
const mastery = GateProfile.computeTopicMastery();
check("mastery covers all 15 taxonomy topics", mastery.length === 15, "got " + mastery.length);
check("mastery ids match taxonomy ids",
  GATE_TOPICS.list.every((t) => mastery.some((m) => m.id === t.id)));
const geotech = mastery.find((m) => m.id === "geotechnical");
check("practice topic has accuracy", geotech && geotech.accuracy === 80, "got " + (geotech && geotech.accuracy));
check("practice topic totals", geotech && geotech.total === 5 && geotech.correct === 4,
  geotech && `total=${geotech.total} correct=${geotech.correct}`);

/* mock topics should be populated from result.perQuestion */
const mockTouched = mastery.filter((m) => m.id !== "geotechnical" && m.total > 0);
check("mock answers fed into mastery", mockTouched.length > 0, "no topic gained mock data");
/* two attempts of 2015 are recorded, so each answered question counts twice */
const attemptsOf2015 = GateProfile.loadMockHistory().filter((m) => m.year === year).length;
check("mock mastery totals scale with attempt count",
  mockTouched.reduce((s, m) => s + m.total, 0) === (result.totalCorrect + result.totalWrong) * attemptsOf2015,
  `mastery=${mockTouched.reduce((s, m) => s + m.total, 0)} expected=${(result.totalCorrect + result.totalWrong) * attemptsOf2015}`);
check("mastery correct matches attempts x scorer correct",
  mockTouched.reduce((s, m) => s + m.correct, 0) === result.totalCorrect * attemptsOf2015);
check("unattempted topics have null accuracy",
  mastery.filter((m) => m.total === 0).every((m) => m.accuracy === null));

console.log("\n=== 8. aggregate stats ===");
const stats = GateProfile.computeStats();
check("mock count", stats.mock.count === 2, "got " + stats.mock.count);
check("practice sessions", stats.practice.sessions === 1);
check("practice questions", stats.practice.totalQuestions === 5);
check("combined accuracy computed", stats.combined.accuracy !== null);
check("combined accuracy is sane", stats.combined.accuracy >= 0 && stats.combined.accuracy <= 100,
  "got " + stats.combined.accuracy);
check("best score is a number", typeof stats.mock.bestScore === "number");
check("avg score is a number", typeof stats.mock.avgScore === "number");
check("best >= avg", stats.mock.bestScore >= stats.mock.avgScore);

console.log("\n=== 9. export / reset ===");
const dump = GateProfile.exportData();
check("export has profile", dump.profile && dump.profile.name === "Arjun Sharma");
check("export has mock history", dump.mockHistory.length === 2);
check("export has practice history", dump.practiceHistory.length === 1);
check("export is JSON-safe", (() => { try { JSON.stringify(dump); return true; } catch (e) { return false; } })());

GateProfile.resetAll();
check("reset clears profile", GateProfile.load() === null);
check("reset clears mock history", GateProfile.loadMockHistory().length === 0);
check("reset clears practice history", GateProfile.loadPracticeHistory().length === 0);
check("reset clears stored results", sandbox.GateStorage.loadResult("2015") === null);
check("reset clears onboarding state", GateProfile.isOnboarded() === false);

console.log("\n=== 10. legacy result bootstrap ===");
sandbox.GateStorage.saveResult("2022", {
  totalScore: 55, totalCorrect: 40, totalWrong: 10, totalUnattempted: 15,
  sectionScores: [], perQuestion: [], submittedAt: Date.now()
});
const boot = GateProfile.loadMockHistory();
check("pre-existing gate-result seeded into history", boot.length === 1 && boot[0].year === "2022",
  "got " + JSON.stringify(boot.map((b) => b.year)));
check("seeded entry normalised", boot[0].label === "GATE CE 2022", "got " + boot[0].label);

console.log("\n=== 11. unknown-year / missing-paper safety ===");
GateProfile.recordMockResult("2099-NOPE", { totalScore: 1, totalCorrect: 1, submittedAt: Date.now() });
const m2 = GateProfile.computeTopicMastery();
check("mastery still returns full taxonomy", m2.length === 15, "got " + m2.length);
check("no throw on unknown year", true);

console.log("\n=== 12. per-attempt verdicts are NOT shared across attempts ===");
/* Regression: gate-result-<year> is a single slot that a later attempt
   overwrites. Each history entry must carry its own verdicts, otherwise an
   older attempt is counted with the newer attempt's answers. */
GateProfile.resetAll();

const q = paper.questions[0];
const idA = { selected: Array.isArray(q.correctAnswer) ? q.correctAnswer[0]
  : String(q.correctAnswer).split(" OR ")[0].trim() };

/* attempt 1: Q1 correct */
GateProfile.recordMockResult(year, {
  totalScore: 1, totalCorrect: 1, totalWrong: 0, totalUnattempted: 0,
  perQuestion: [{ id: q.id, verdict: "correct" }], submittedAt: 1000
});
/* attempt 2: Q1 wrong - overwrites the single gate-result slot */
GateProfile.recordMockResult(year, {
  totalScore: 0, totalCorrect: 0, totalWrong: 1, totalUnattempted: 0,
  perQuestion: [{ id: q.id, verdict: "wrong" }], submittedAt: 2000
});
sandbox.GateStorage.saveResult(year, { totalScore: 0, totalCorrect: 0, totalWrong: 1,
  totalUnattempted: 0, perQuestion: [{ id: q.id, verdict: "wrong" }], submittedAt: 2000 });

const att = GateProfile.loadMockHistory().filter((m) => m.year === year);
check("both attempts retained", att.length === 2, "got " + att.length);
check("each attempt carries its own perQuestion",
  att.every((m) => Array.isArray(m.perQuestion) && m.perQuestion.length === 1),
  JSON.stringify(att.map((m) => (m.perQuestion || []).length)));

const topicOfQ = GATE_TOPICS.classify(q);
const bucket = GateProfile.computeTopicMastery().find((m) => m.id === topicOfQ);
check("one correct + one wrong counted for the topic (not two of the latest)",
  bucket.total === 2 && bucket.correct === 1 && bucket.wrong === 1,
  `total=${bucket.total} correct=${bucket.correct} wrong=${bucket.wrong}`);

console.log("\n=== 13. legacy entry without perQuestion still works ===");
GateProfile.resetAll();
GateProfile.recordMockResult(year, {
  totalScore: 1, totalCorrect: 1, totalWrong: 0, totalUnattempted: 0, submittedAt: 500
});
sandbox.GateStorage.saveResult(year, { totalScore: 1, totalCorrect: 1, totalWrong: 0,
  totalUnattempted: 0, perQuestion: [{ id: q.id, verdict: "correct" }], submittedAt: 500 });
const legacyBucket = GateProfile.computeTopicMastery().find((m) => m.id === topicOfQ);
check("legacy fallback reads stored result", legacyBucket.total === 1 && legacyBucket.correct === 1,
  `total=${legacyBucket.total} correct=${legacyBucket.correct}`);

console.log("\n=== 14. export -> wipe -> import round-trip ===");
GateProfile.resetAll();
GateProfile.save({ name: "Round Trip" });

/* build a realistic state: 2 mock attempts + 2 practice sessions */
function makeAttempt(qid, verdict, ts, score) {
  return {
    totalScore: score, totalCorrect: verdict === "correct" ? 1 : 0,
    totalWrong: verdict === "wrong" ? 1 : 0, totalUnattempted: 0,
    perQuestion: [{ id: qid, verdict: verdict }], submittedAt: ts
  };
}
GateProfile.recordMockResult(year, makeAttempt(q.id, "correct", 1000, 2));
GateProfile.recordMockResult(year, makeAttempt(q.id, "wrong", 2000, 0));
GateProfile.savePracticeSession({
  type: "practice", topics: [{ topic: "surveying", correct: 3, wrong: 2, skipped: 0, total: 5 }],
  correct: 3, wrong: 2, skipped: 0, score: 5, total: 5, completedAt: 3000
});

const before = {
  stats: GateProfile.computeStats(),
  mastery: GateProfile.computeTopicMastery(),
  mocks: GateProfile.loadMockHistory().length,
  practice: GateProfile.loadPracticeHistory().length
};

/* the file a user would download */
const backupText = JSON.stringify(GateProfile.exportData());

/* simulate: browser data cleared entirely */
Object.keys(store).forEach((k) => delete store[k]);
check("wipe actually cleared storage", Object.keys(store).length === 0);
check("stats empty after wipe", GateProfile.computeStats().mock.count === 0);

/* import it back */
const imported = GateProfile.importData(backupText);
check("import accepted", imported.ok === true, imported.error);
check("import reports counts", imported.counts.mocks === 2 && imported.counts.practice === 1,
  JSON.stringify(imported.counts));

const after = {
  stats: GateProfile.computeStats(),
  mastery: GateProfile.computeTopicMastery(),
  mocks: GateProfile.loadMockHistory().length,
  practice: GateProfile.loadPracticeHistory().length
};

check("name restored", GateProfile.load().name === "Round Trip");
check("mock count restored", after.mocks === before.mocks);
check("practice count restored", after.practice === before.practice);
check("mock stats identical",
  JSON.stringify(after.stats.mock) === JSON.stringify(before.stats.mock),
  JSON.stringify(after.stats.mock) + " vs " + JSON.stringify(before.stats.mock));
check("practice stats identical",
  JSON.stringify(after.stats.practice) === JSON.stringify(before.stats.practice));
check("combined accuracy identical", after.stats.combined.accuracy === before.stats.combined.accuracy);
check("topic mastery identical",
  JSON.stringify(after.mastery) === JSON.stringify(before.mastery),
  "mastery mismatch after import");
check("per-attempt verdicts survived", (() => {
  const att = GateProfile.loadMockHistory().filter((m) => m.year === year);
  return att.length === 2 && att.every((m) => Array.isArray(m.perQuestion) && m.perQuestion.length === 1);
})());
check("result slot rebuilt for rows lacking perQuestion wiring",
  !!sandbox.GateStorage.loadResult(year),
  "gate-result slot not rebuilt after import");

console.log("\n=== 15. import validation rejects bad input ===");
const badCases = [
  ["not json", "definitely { not json"],
  ["empty object", "{}"],
  ["array", "[]"],
  ["null", "null"],
  ["corrupt profile", JSON.stringify({ profile: "nope", mockHistory: [] })],
  ["corrupt mockHistory", JSON.stringify({ profile: { name: "x" }, mockHistory: "nope" })]
];
badCases.forEach(([label, payload]) => {
  const v = GateProfile.validateImport(payload);
  check("rejects " + label, v.ok === false, "accepted " + label);
});
check("accepts a valid export", GateProfile.validateImport(backupText).ok === true);
check("importData refuses bad input without throwing",
  GateProfile.importData("garbage").ok === false);

/* a rejected import must not damage existing state */
const stillThere = GateProfile.computeStats();
check("state intact after rejected import", stillThere.mock.count === after.mocks);

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);

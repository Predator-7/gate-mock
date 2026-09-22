// Node verification script for profile-page.js and onboarding.js DOM logic
const fs = require('fs');
const path = require('path');

// Setup mock DOM environment
const elements = {};
function createElement(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    className: '',
    style: {},
    dataset: {},
    children: [],
    listeners: {},
    appendChild(child) { el.children.push(child); return child; },
    removeChild(child) {
      const idx = el.children.indexOf(child);
      if (idx !== -1) el.children.splice(idx, 1);
      return child;
    },
    addEventListener(evt, fn) {
      if (!el.listeners[evt]) el.listeners[evt] = [];
      el.listeners[evt].push(fn);
    },
    click() {
      if (el.listeners['click']) el.listeners['click'].forEach(fn => fn({ target: el, preventDefault: () => {} }));
    },
    closest(selector) {
      if (selector.startsWith('.') && el.className.includes(selector.slice(1))) return el;
      return null;
    },
    querySelectorAll(selector) {
      return el.children.filter(c => selector.startsWith('.') && c.className.includes(selector.slice(1)));
    },
    remove() {
      // remove self from parent if needed
    },
    classList: {
      _classes: new Set(),
      add(c) { el.classList._classes.add(c); el.className = Array.from(el.classList._classes).join(' '); },
      remove(c) { el.classList._classes.delete(c); el.className = Array.from(el.classList._classes).join(' '); },
      toggle(c, force) {
        if (force === true) el.classList.add(c);
        else if (force === false) el.classList.remove(c);
        else if (el.classList._classes.has(c)) el.classList.remove(c);
        else el.classList.add(c);
      },
      contains(c) { return el.classList._classes.has(c); }
    },
    get textContent() { return el._text || ''; },
    set textContent(val) { el._text = String(val); },
    get innerHTML() { return el._html || ''; },
    set innerHTML(val) { el._html = String(val); }
  };
  return el;
}

function getOrCreateElement(id) {
  if (!elements[id]) {
    elements[id] = createElement('div');
    elements[id].id = id;
  }
  return elements[id];
}

const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

global.document = {
  getElementById: (id) => getOrCreateElement(id),
  querySelector: (sel) => {
    if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
    return createElement('div');
  },
  querySelectorAll: () => [],
  createElement: createElement,
  head: createElement('head'),
  body: createElement('body'),
  addEventListener: () => {}
};

global.window = {
  localStorage: global.localStorage,
  location: { pathname: '/profile.html', search: '' },
  addEventListener: () => {},
  dispatchEvent: () => {},
  document: global.document,
  GATE_MANIFEST: [
    { year: "2025_ce1", label: "GATE 2025 CE Session 1" }
  ]
};

// Evaluate scripts
const topicsCode = fs.readFileSync(path.join(__dirname, '../data/topics.js'), 'utf8');
eval(topicsCode);

const profileCode = fs.readFileSync(path.join(__dirname, '../js/profile.js'), 'utf8');
eval(profileCode);

const onboardingCode = fs.readFileSync(path.join(__dirname, '../js/onboarding.js'), 'utf8');
eval(onboardingCode);

console.log("Onboarding initials:", window.GateOnboarding.initials("Priya Sharma"));
console.assert(window.GateOnboarding.initials("Priya Sharma") === "PS", "Initials mismatch");
console.assert(window.GateOnboarding.initials("Ankit") === "AN", "Single name initials mismatch");

// Save user name
window.GateProfile.save({ name: "Priya Sharma" });

// Save 1 mock test and 1 practice session
window.GateProfile.recordMockResult("2025_ce1", "GATE 2025 CE Session 1", {
  totalScore: 62.33,
  maxScore: 100,
  totalCorrect: 42,
  totalWrong: 10,
  totalUnattempted: 13,
  submittedAt: Date.now()
});

window.GateProfile.savePracticeSession({
  topics: ["geotechnical", "environmental"],
  topicNames: ["Geotechnical Engineering", "Environmental Engineering"],
  total: 15,
  correct: 12,
  wrong: 3,
  skipped: 0,
  score: 18,
  topicBreakdown: {
    geotechnical: { total: 10, correct: 9, wrong: 1, skipped: 0 },
    environmental: { total: 5, correct: 3, wrong: 2, skipped: 0 }
  },
  submittedAt: Date.now()
});

// Evaluate profile-page.js
const profilePageCode = fs.readFileSync(path.join(__dirname, '../js/profile-page.js'), 'utf8');
eval(profilePageCode);

// Trigger DOMContentLoaded
const stats = window.GateProfile.computeStats();
console.assert(stats.mock.count === 1, "Mock count mismatch");
console.assert(stats.practice.totalQuestions === 15, "Practice Qs mismatch");
console.assert(stats.practice.accuracy === 80, "Practice accuracy mismatch");

console.log("DOM and Profile verification completed successfully!");

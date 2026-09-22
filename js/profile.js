/* ============================================================
   GATE CE — User Profile, Progress Tracking & Storage Engine
   ============================================================ */
(function () {

  var PROFILE_KEY   = "gate_profile";
  var MOCK_HIST_KEY = "gate_mock_history";
  var PRAC_HIST_KEY = "gate_practice_history";

  /* ── LocalStorage Helpers ── */
  function safeGet(k) {
    try {
      var r = localStorage.getItem(k);
      return r ? JSON.parse(r) : null;
    } catch(e) {
      return null;
    }
  }

  /* ── Request Persistent Storage Permission from Browser ── */
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function () {});
  }

  /* ── IndexedDB Vault Mirroring (Secondary Browser Storage Layer) ── */
  var idbReq = null;
  function getIDB() {
    if (typeof indexedDB === "undefined") return null;
    if (!idbReq) {
      try {
        idbReq = indexedDB.open("gate_mock_vault", 1);
        idbReq.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains("store")) {
            db.createObjectStore("store", { keyPath: "key" });
          }
        };
      } catch(e) {
        idbReq = null;
      }
    }
    return idbReq;
  }

  function mirrorToIDB(k, v) {
    var req = getIDB();
    if (!req) return;
    try {
      if (req.result) {
        var tx = req.result.transaction("store", "readwrite");
        tx.objectStore("store").put({ key: k, value: v, updatedAt: Date.now() });
      } else {
        req.addEventListener("success", function () {
          try {
            var tx = req.result.transaction("store", "readwrite");
            tx.objectStore("store").put({ key: k, value: v, updatedAt: Date.now() });
          } catch(e) {}
        });
      }
    } catch(e) {}
  }

  function restoreFromIDB() {
    var req = getIDB();
    if (!req) return;
    function doRead(db) {
      try {
        var tx = db.transaction("store", "readonly");
        var store = tx.objectStore("store");
        if (!store.getAll) return;
        var getAllReq = store.getAll();
        getAllReq.onsuccess = function () {
          var rows = getAllReq.result || [];
          rows.forEach(function (row) {
            if (row && row.key && row.value && !safeGet(row.key)) {
              safeSet(row.key, row.value);
            }
          });
        };
      } catch(e) {}
    }
    if (req.result) {
      doRead(req.result);
    } else {
      req.addEventListener("success", function () {
        doRead(req.result);
      });
    }
  }

  function safeSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      mirrorToIDB(k, v);
      return true;
    } catch(e) {
      console.warn("GateProfile: failed writing", k, e);
      mirrorToIDB(k, v);
      return false;
    }
  }

  /* ══════════════════════════════════════════
     1. USER PROFILE
  ══════════════════════════════════════════ */

  function loadProfile() {
    return safeGet(PROFILE_KEY);
  }

  function saveProfile(data) {
    var existing = loadProfile() || {};
    var merged = Object.assign({}, existing, data, { updatedAt: Date.now() });
    if (!merged.createdAt) merged.createdAt = Date.now();
    safeSet(PROFILE_KEY, merged);
    persistToDisk();
    return merged;
  }

  function deleteProfile() {
    localStorage.removeItem(PROFILE_KEY);
  }

  function isOnboarded() {
    var p = loadProfile();
    return !!(p && p.name && p.name.trim().length >= 2);
  }

  /* ══════════════════════════════════════════
     2. MOCK TEST RESULTS & HISTORY
  ══════════════════════════════════════════ */

  function loadMockHistory() {
    var history = safeGet(MOCK_HIST_KEY) || [];
    var existingKeys = {};
    history.forEach(function (h) {
      if (h.year) existingKeys[h.year] = true;
    });

    var added = false;
    var manifest = window.GATE_MANIFEST || [];

    /* Check for stored results in GateStorage / localStorage */
    manifest.forEach(function (entry) {
      var key = entry.year;
      if (!existingKeys[key]) {
        var r = (window.GateStorage && window.GateStorage.loadResult) ?
                window.GateStorage.loadResult(key) :
                safeGet("gate-result-" + key);
        if (r && (r.totalScore != null || r.score != null || r.submittedAt)) {
          var subAt = r.submittedAt || null;
          var item = {
            id: "mock_legacy_" + key + "_" + (subAt || Date.now()),
            type: "mock",
            year: key,
            label: entry.label || ("GATE CE " + key),
            score: Number(r.totalScore != null ? r.totalScore : (r.score || 0)),
            maxScore: Number(r.maxScore || 100),
            correct: Number(r.totalCorrect != null ? r.totalCorrect : (r.correct || 0)),
            wrong: Number(r.totalWrong != null ? r.totalWrong : (r.wrong || 0)),
            unattempted: Number(r.totalUnattempted != null ? r.totalUnattempted : (r.unattempted || 0)),
            submittedAt: subAt,
            perQuestion: Array.isArray(r.perQuestion) ? r.perQuestion.slice() : []
          };
          item.total = item.correct + item.wrong + item.unattempted;
          item.percentage = item.maxScore > 0 ? ((item.score / item.maxScore) * 100).toFixed(1) : "0.0";
          history.push(item);
          existingKeys[key] = true;
          added = true;
        }
      }
    });

    // Also scan any gate-result-<year> in localStorage not in manifest
    try {
      if (typeof localStorage !== "undefined" && localStorage.length) {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf("gate-result-") === 0) {
            var y = k.replace("gate-result-", "");
            if (!existingKeys[y]) {
              var r2 = safeGet(k);
              if (r2 && (r2.totalScore != null || r2.score != null || r2.submittedAt)) {
                var mEntry = manifest.find(function(m){ return m.year === y; });
                var item2 = {
                  id: "mock_legacy_" + y + "_" + (r2.submittedAt || Date.now()),
                  type: "mock",
                  year: y,
                  label: mEntry ? mEntry.label : ("GATE CE " + y),
                  score: Number(r2.totalScore != null ? r2.totalScore : (r2.score || 0)),
                  maxScore: Number(r2.maxScore || 100),
                  correct: Number(r2.totalCorrect != null ? r2.totalCorrect : (r2.correct || 0)),
                  wrong: Number(r2.totalWrong != null ? r2.totalWrong : (r2.wrong || 0)),
                  unattempted: Number(r2.totalUnattempted != null ? r2.totalUnattempted : (r2.unattempted || 0)),
                  submittedAt: r2.submittedAt || null,
                  perQuestion: Array.isArray(r2.perQuestion) ? r2.perQuestion.slice() : []
                };
                item2.total = item2.correct + item2.wrong + item2.unattempted;
                item2.percentage = item2.maxScore > 0 ? ((item2.score / item2.maxScore) * 100).toFixed(1) : "0.0";
                history.push(item2);
                existingKeys[y] = true;
                added = true;
              }
            }
          }
        }
      }
    } catch(e) {}

    if (added) {
      safeSet(MOCK_HIST_KEY, history);
    }
    return history;
  }

  function recordMockResult(year, label, result) {
    if (typeof label === "object" && !result) {
      result = label;
      label = null;
    }
    result = result || {};

    var history = safeGet(MOCK_HIST_KEY) || [];

    // Guard duplicate submit: check same paper & submittedAt
    var subAt = result.submittedAt || Date.now();
    var isDuplicate = history.some(function(h) {
      return h.year === year && h.submittedAt === subAt;
    });
    if (isDuplicate) return history[0];

    var manifestEntry = (window.GATE_MANIFEST || []).find(function(m) { return m.year === year; });
    var finalLabel = label || (manifestEntry ? manifestEntry.label : ("GATE CE " + year));

    var entry = {
      id: "mock_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      type: "mock",
      year: year,
      label: finalLabel,
      score: Number(result.totalScore != null ? result.totalScore : (result.score || 0)),
      maxScore: Number(result.maxScore || 100),
      correct: Number(result.totalCorrect != null ? result.totalCorrect : (result.correct || 0)),
      wrong: Number(result.totalWrong != null ? result.totalWrong : (result.wrong || 0)),
      unattempted: Number(result.totalUnattempted != null ? result.totalUnattempted : (result.unattempted || 0)),
      submittedAt: subAt,
      perQuestion: Array.isArray(result.perQuestion) ? result.perQuestion.slice() : []
    };
    entry.total = entry.correct + entry.wrong + entry.unattempted;
    entry.percentage = entry.maxScore > 0 ? ((entry.score / entry.maxScore) * 100).toFixed(1) : "0.0";

    history.unshift(entry);
    if (history.length > 100) history = history.slice(0, 100);
    safeSet(MOCK_HIST_KEY, history);
    persistToDisk();
    return entry;
  }

  function allMockResults() {
    return loadMockHistory().slice().sort(function(a, b) {
      return (b.submittedAt || 0) - (a.submittedAt || 0);
    });
  }

  /* ══════════════════════════════════════════
     3. PRACTICE SESSIONS HISTORY
  ══════════════════════════════════════════ */

  function loadPracticeHistory() {
    return safeGet(PRAC_HIST_KEY) || [];
  }

  function savePracticeSession(session) {
    session = session || {};
    var history = loadPracticeHistory();
    var subAt = session.completedAt || session.submittedAt || Date.now();
    var record = {
      id: session.id || ("practice-" + Date.now() + "-" + Math.floor(Math.random() * 10000)),
      type: "practice",
      submittedAt: subAt,
      completedAt: subAt,
      topics: session.topics || [],
      topicNames: session.topicNames || [],
      years: session.years || [],
      total: Number(session.total || 0),
      correct: Number(session.correct || 0),
      wrong: Number(session.wrong || 0),
      skipped: Number(session.skipped || 0),
      score: Number(session.score != null ? session.score : 0),
      topicBreakdown: session.topicBreakdown || {}
    };
    record.percentage = record.total > 0 ? Math.round((record.correct / record.total) * 100) : 0;

    history.unshift(record);
    if (history.length > 100) history = history.slice(0, 100);
    safeSet(PRAC_HIST_KEY, history);
    persistToDisk();
    return record;
  }

  function clearPracticeHistory() {
    localStorage.removeItem(PRAC_HIST_KEY);
  }

  /* ══════════════════════════════════════════
     4. TOPIC MASTERY & AGGREGATE STATS
  ══════════════════════════════════════════ */

  function computeTopicMastery() {
    var rawTopics = (window.GATE_TOPICS && window.GATE_TOPICS.list) || [
      { id: "general-aptitude",     name: "General Aptitude",          icon: "🧠", color: "#7c3aed" },
      { id: "engineering-math",     name: "Engineering Mathematics",   icon: "📐", color: "#0891b2" },
      { id: "structural-analysis",  name: "Structural Analysis",       icon: "🏗️", color: "#0369a1" },
      { id: "solid-mechanics",      name: "Solid Mechanics & Design",  icon: "🔩", color: "#b45309" },
      { id: "concrete-structures",  name: "Concrete Structures (RCC)", icon: "🧱", color: "#6b7280" },
      { id: "steel-structures",     name: "Steel Structures",          icon: "⚙️", color: "#374151" },
      { id: "construction-mgmt",    name: "Construction & Management", icon: "🏛️", color: "#065f46" },
      { id: "geotechnical",         name: "Geotechnical Engineering",  icon: "🌍", color: "#92400e" },
      { id: "fluid-mechanics",      name: "Fluid Mechanics",           icon: "💧", color: "#1d4ed8" },
      { id: "hydraulics",           name: "Hydraulics & Open Channel", icon: "🌊", color: "#0e7490" },
      { id: "hydrology",            name: "Hydrology",                 icon: "🌧️", color: "#1e40af" },
      { id: "irrigation",           name: "Irrigation Engineering",    icon: "🚿", color: "#15803d" },
      { id: "environmental",        name: "Environmental Engineering", icon: "🌿", color: "#166534" },
      { id: "transportation",       name: "Transportation Engineering", icon: "🛣️", color: "#be185d" },
      { id: "surveying",            name: "Surveying & Geomatics",     icon: "📏", color: "#7c2d12" }
    ];

    var list = rawTopics.map(function (t) {
      return {
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color,
        total: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        accuracy: null,
        status: "untested"
      };
    });

    var map = {};
    list.forEach(function (m) { map[m.id] = m; });

    /* Aggregate Practice Sessions */
    var practiceHistory = loadPracticeHistory();
    practiceHistory.forEach(function (s) {
      if (Array.isArray(s.topics)) {
        s.topics.forEach(function (top) {
          if (typeof top === "object" && top !== null) {
            var tid = top.topic || top.id;
            var bucket = map[tid];
            if (bucket) {
              var c = Number(top.correct || 0);
              var w = Number(top.wrong || 0);
              var sk = Number(top.skipped || 0);
              var tot = (top.total != null) ? Number(top.total) : (c + w);
              bucket.correct += c;
              bucket.wrong   += w;
              bucket.skipped += sk;
              bucket.total   += tot;
            }
          }
        });
      }
      if (s.topicBreakdown && typeof s.topicBreakdown === "object") {
        Object.keys(s.topicBreakdown).forEach(function (k) {
          var bucket = map[k];
          if (!bucket) return;
          var b = s.topicBreakdown[k];
          var c = Number(b.correct || 0);
          var tot = Number(b.total || 0);
          var w = (b.wrong != null) ? Number(b.wrong) : (tot - c);
          bucket.correct += c;
          bucket.wrong   += (w >= 0 ? w : 0);
          bucket.skipped += Number(b.skipped || 0);
          bucket.total   += (tot > 0 ? tot : (c + w));
        });
      }
    });

    /* Aggregate Mock Attempts */
    var mockHistory = loadMockHistory();
    mockHistory.forEach(function (m) {
      var perQ = (Array.isArray(m.perQuestion) && m.perQuestion.length > 0) ? m.perQuestion : null;
      if (!perQ && window.GateStorage && window.GateStorage.loadResult) {
        var stored = window.GateStorage.loadResult(m.year);
        if (stored && Array.isArray(stored.perQuestion)) perQ = stored.perQuestion;
      }
      if (!perQ) return;

      var paper = (window.GATE_PAPERS && window.GATE_PAPERS[m.year]) || null;
      var qMap = {};
      if (paper && Array.isArray(paper.questions)) {
        paper.questions.forEach(function(q) { qMap[q.id] = q; });
      }

      perQ.forEach(function (item) {
        var q = qMap[item.id];
        if (!q) return;
        var tid = window.GATE_TOPICS ? window.GATE_TOPICS.classify(q) : "engineering-math";
        var bucket = map[tid];
        if (!bucket) return;

        if (item.verdict === "correct") {
          bucket.correct++;
          bucket.total++;
        } else if (item.verdict === "wrong") {
          bucket.wrong++;
          bucket.total++;
        } else if (item.verdict === "unattempted" || item.verdict === "skipped") {
          bucket.skipped++;
        }
      });
    });

    /* Finalize accuracies and status */
    list.forEach(function (m) {
      if (m.total > 0) {
        m.accuracy = Math.round((m.correct / m.total) * 100);
        if (m.accuracy >= 75) m.status = "strong";
        else if (m.accuracy >= 45) m.status = "average";
        else m.status = "weak";
      } else {
        m.accuracy = null;
        m.status = "untested";
      }
      m.attempted = m.total;
    });

    return list;
  }

  function getTopicMastery() {
    var list = computeTopicMastery();
    var dict = {};
    list.forEach(function (m) { dict[m.id] = m; });
    return dict;
  }

  function computeStats() {
    var mocks = loadMockHistory();
    var practice = loadPracticeHistory();

    var mockStats = {
      count: mocks.length,
      totalCorrect: 0,
      totalWrong: 0,
      totalUnattempted: 0,
      bestScore: null,
      avgScore: null
    };

    mocks.forEach(function(r) {
      mockStats.totalCorrect     += (r.correct || 0);
      mockStats.totalWrong       += (r.wrong || 0);
      mockStats.totalUnattempted += (r.unattempted || 0);
      if (mockStats.bestScore === null || r.score > mockStats.bestScore) {
        mockStats.bestScore = r.score;
      }
    });

    if (mocks.length > 0) {
      var totalMarks = mocks.reduce(function(sum, r){ return sum + r.score; }, 0);
      mockStats.avgScore = totalMarks / mocks.length;
    }

    var practiceStats = {
      sessions: practice.length,
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalSkipped: 0,
      accuracy: 0
    };

    practice.forEach(function(s) {
      practiceStats.totalQuestions += (s.total || 0);
      practiceStats.totalCorrect   += (s.correct || 0);
      practiceStats.totalWrong     += (s.wrong || 0);
      practiceStats.totalSkipped   += (s.skipped || 0);
    });

    var practiceAttempted = practiceStats.totalCorrect + practiceStats.totalWrong;
    if (practiceAttempted > 0) {
      practiceStats.accuracy = Math.round((practiceStats.totalCorrect / practiceAttempted) * 100);
    }

    var overallQuestionsAttempted = (mockStats.totalCorrect + mockStats.totalWrong) +
                                    (practiceStats.totalCorrect + practiceStats.totalWrong);
    var overallCorrect = mockStats.totalCorrect + practiceStats.totalCorrect;
    var overallAccuracy = overallQuestionsAttempted > 0 ?
                          Math.round((overallCorrect / overallQuestionsAttempted) * 100) : null;

    return {
      mock: mockStats,
      practice: practiceStats,
      overall: {
        questionsAttempted: overallQuestionsAttempted,
        correct: overallCorrect,
        accuracy: overallAccuracy == null ? 0 : overallAccuracy
      },
      combined: {
        attempted: overallQuestionsAttempted,
        correct: overallCorrect,
        accuracy: overallAccuracy
      }
    };
  }

  /* ══════════════════════════════════════════
     5. BACKUP, RESTORE & RESET
  ══════════════════════════════════════════ */

  function exportData() {
    return {
      profile: loadProfile(),
      mockHistory: loadMockHistory(),
      practiceHistory: loadPracticeHistory(),
      exportedAt: new Date().toISOString()
    };
  }

  function exportAllData() {
    return JSON.stringify(exportData(), null, 2);
  }

  function validateImport(text) {
    if (typeof text !== "string") return { ok: false, error: "Input must be a string" };
    var data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return { ok: false, error: "Invalid JSON format" };
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, error: "Expected a JSON object" };
    }
    if (data.profile != null && (typeof data.profile !== "object" || Array.isArray(data.profile))) {
      return { ok: false, error: "Corrupted profile data in backup" };
    }
    if (data.mockHistory != null && !Array.isArray(data.mockHistory)) {
      return { ok: false, error: "Corrupted mock history data in backup" };
    }
    if (data.practiceHistory != null && !Array.isArray(data.practiceHistory)) {
      return { ok: false, error: "Corrupted practice history data in backup" };
    }
    if (!data.profile && !data.mockHistory && !data.practiceHistory) {
      return { ok: false, error: "Backup file contains no identifiable GATE profile or history" };
    }
    return { ok: true, data: data };
  }

  function importData(dataOrText) {
    var check = typeof dataOrText === "string" ? validateImport(dataOrText) : { ok: true, data: dataOrText };
    if (!check.ok) return check;
    var d = check.data;

    if (d.profile && typeof d.profile === "object") {
      saveProfile(d.profile);
    }

    if (Array.isArray(d.mockHistory)) {
      safeSet(MOCK_HIST_KEY, d.mockHistory);
      d.mockHistory.forEach(function (m) {
        if (m.year && window.GateStorage && window.GateStorage.saveResult) {
          window.GateStorage.saveResult(m.year, {
            year: m.year,
            totalScore: m.score,
            maxScore: m.maxScore || 100,
            totalCorrect: m.correct,
            totalWrong: m.wrong,
            totalUnattempted: m.unattempted,
            perQuestion: m.perQuestion || [],
            submittedAt: m.submittedAt
          });
        }
      });
    }

    if (Array.isArray(d.practiceHistory)) {
      safeSet(PRAC_HIST_KEY, d.practiceHistory);
    }

    return {
      ok: true,
      counts: {
        mocks: (d.mockHistory || []).length,
        practice: (d.practiceHistory || []).length
      }
    };
  }

  function resetAll() {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(MOCK_HIST_KEY);
    localStorage.removeItem(PRAC_HIST_KEY);

    var manifest = window.GATE_MANIFEST || [];
    manifest.forEach(function (entry) {
      if (window.GateStorage && window.GateStorage.clearResult) {
        window.GateStorage.clearResult(entry.year);
      }
      localStorage.removeItem("gate-result-" + entry.year);
      localStorage.removeItem("gate-attempt-" + entry.year);
      localStorage.removeItem("gate_attempt_" + entry.year);
    });

    try {
      if (typeof localStorage !== "undefined" && localStorage.length) {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var key = localStorage.key(i);
          if (key && (key.indexOf("gate-result-") === 0 || key.indexOf("gate_attempt_") === 0 || key.indexOf("gate-attempt-") === 0)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch(e) {}

    persistToDisk();
  }

  /* ══════════════════════════════════════════
     6. AUTOMATIC DISK FILE SYNC (userData.json)
  ══════════════════════════════════════════ */
  var diskSyncActive = false;
  var lastDiskSyncTime = null;
  var syncTimeout = null;

  function isDiskSyncActive() {
    return diskSyncActive;
  }

  function getLastDiskSyncTime() {
    return lastDiskSyncTime;
  }

  function getFullDiskPayload() {
    var attempts = {};
    try {
      if (typeof localStorage !== "undefined" && localStorage.length) {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && (k.indexOf("gate_attempt_") === 0 || k.indexOf("gate-attempt-") === 0)) {
            attempts[k] = safeGet(k);
          }
        }
      }
    } catch(e) {}

    return {
      profile: loadProfile(),
      mockHistory: loadMockHistory(),
      practiceHistory: loadPracticeHistory(),
      attempts: attempts,
      updatedAt: new Date().toISOString()
    };
  }

  function persistToDisk() {
    if (typeof fetch !== "function" || typeof window === "undefined" || !window.location) return;
    if (window.location.protocol === "file:") return;
    if (typeof setTimeout !== "function") return;

    if (syncTimeout && typeof clearTimeout === "function") clearTimeout(syncTimeout);
    syncTimeout = setTimeout(function () {
      var payload = getFullDiskPayload();
      fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(function (res) {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then(function (data) {
        diskSyncActive = true;
        lastDiskSyncTime = Date.now();
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("gate:diskSaved", { detail: { timestamp: lastDiskSyncTime } }));
        }
      })
      .catch(function () {
        // Silently continue if server is not listening
      });
    }, 200);
  }

  function syncWithDisk(callback) {
    if (typeof fetch !== "function" || typeof window === "undefined" || !window.location) {
      if (callback) callback(false);
      return;
    }
    if (window.location.protocol === "file:") {
      if (callback) callback(false);
      return;
    }

    fetch("/api/user-data")
      .then(function (res) {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object") return;
        diskSyncActive = true;
        lastDiskSyncTime = Date.now();

        // Hydrate profile
        if (data.profile && typeof data.profile === "object" && data.profile.name) {
          var currProf = loadProfile();
          if (!currProf || !currProf.name || (data.profile.updatedAt && data.profile.updatedAt > (currProf.updatedAt || 0))) {
            safeSet(PROFILE_KEY, data.profile);
          }
        }

        // Hydrate mock history
        if (Array.isArray(data.mockHistory) && data.mockHistory.length > 0) {
          var currMocks = safeGet(MOCK_HIST_KEY) || [];
          if (data.mockHistory.length >= currMocks.length) {
            safeSet(MOCK_HIST_KEY, data.mockHistory);
          }
        }

        // Hydrate practice history
        if (Array.isArray(data.practiceHistory) && data.practiceHistory.length > 0) {
          var currPrac = safeGet(PRAC_HIST_KEY) || [];
          if (data.practiceHistory.length >= currPrac.length) {
            safeSet(PRAC_HIST_KEY, data.practiceHistory);
          }
        }

        // Hydrate in-progress attempts
        if (data.attempts && typeof data.attempts === "object") {
          Object.keys(data.attempts).forEach(function (k) {
            if (data.attempts[k] && !safeGet(k)) {
              safeSet(k, data.attempts[k]);
            }
          });
        }

        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("gate:diskSynced", { detail: data }));
        }
        if (callback) callback(true, data);
      })
      .catch(function (err) {
        diskSyncActive = false;
        if (callback) callback(false, err);
      });
  }

  // Automatic sync on window boot
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    restoreFromIDB();
    if (typeof fetch === "function") {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { syncWithDisk(); });
      } else if (typeof setTimeout === "function") {
        setTimeout(function () { syncWithDisk(); }, 0);
      }
    }
  }

  /* ── Expose Globally ── */
  window.GateProfile = {
    load: loadProfile,
    save: saveProfile,
    delete: deleteProfile,
    isOnboarded: isOnboarded,
    loadMockHistory: loadMockHistory,
    recordMockResult: recordMockResult,
    allMockResults: allMockResults,
    loadPracticeHistory: loadPracticeHistory,
    savePracticeSession: savePracticeSession,
    clearPracticeHistory: clearPracticeHistory,
    computeTopicMastery: computeTopicMastery,
    getTopicMastery: getTopicMastery,
    computeStats: computeStats,
    exportData: exportData,
    exportAllData: exportAllData,
    validateImport: validateImport,
    importData: importData,
    resetAll: resetAll,
    resetAllData: resetAll,
    isDiskSyncActive: isDiskSyncActive,
    getLastDiskSyncTime: getLastDiskSyncTime,
    syncWithDisk: syncWithDisk,
    persistToDisk: persistToDisk
  };

})();

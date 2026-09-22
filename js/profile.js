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

  function safeSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch(e) {
      console.warn("GateProfile: failed writing", k, e);
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
    return safeGet(MOCK_HIST_KEY) || [];
  }

  function recordMockResult(year, label, result) {
    if (typeof label === "object" && !result) {
      result = label;
      label = "GATE " + year;
    }
    result = result || {};
    var history = loadMockHistory();
    var entry = {
      id: "mock_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      type: "mock",
      year: year,
      label: label || ("GATE " + year),
      score: Number(result.totalScore != null ? result.totalScore : (result.score || 0)),
      maxScore: Number(result.maxScore || 100),
      correct: Number(result.totalCorrect != null ? result.totalCorrect : (result.correct || 0)),
      wrong: Number(result.totalWrong != null ? result.totalWrong : (result.wrong || 0)),
      unattempted: Number(result.totalUnattempted != null ? result.totalUnattempted : (result.unattempted || 0)),
      submittedAt: result.submittedAt || Date.now()
    };
    entry.total = entry.correct + entry.wrong + entry.unattempted;
    entry.percentage = entry.maxScore > 0 ? ((entry.score / entry.maxScore) * 100).toFixed(1) : "0.0";

    history.unshift(entry);
    if (history.length > 100) history = history.slice(0, 100);
    safeSet(MOCK_HIST_KEY, history);
    return entry;
  }

  /* Get all mock results combining history log & standalone gate-result-{year} */
  function allMockResults() {
    var history = loadMockHistory();
    var historyYears = {};
    history.forEach(function (h) {
      if (h.year) historyYears[h.year] = true;
    });

    var results = history.slice();

    /* Also incorporate any legacy gate-result-{year} that wasn't recorded in history */
    var manifest = window.GATE_MANIFEST || [];
    manifest.forEach(function (entry) {
      if (!historyYears[entry.year]) {
        var r = safeGet("gate-result-" + entry.year);
        if (r) {
          var item = {
            id: "legacy_" + entry.year,
            type: "mock",
            year: entry.year,
            label: entry.label || ("GATE " + entry.year),
            score: Number(r.totalScore != null ? r.totalScore : (r.score || 0)),
            maxScore: Number(r.maxScore || 100),
            correct: Number(r.totalCorrect != null ? r.totalCorrect : (r.correct || 0)),
            wrong: Number(r.totalWrong != null ? r.totalWrong : (r.wrong || 0)),
            unattempted: Number(r.totalUnattempted != null ? r.totalUnattempted : (r.unattempted || 0)),
            submittedAt: r.submittedAt || null
          };
          item.total = item.correct + item.wrong + item.unattempted;
          item.percentage = item.maxScore > 0 ? ((item.score / item.maxScore) * 100).toFixed(1) : "0.0";
          results.push(item);
        }
      }
    });

    return results.sort(function(a, b) {
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
    var history = loadPracticeHistory();
    var record = {
      id: "prac_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      submittedAt: session.submittedAt || Date.now(),
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
    return record;
  }

  function clearPracticeHistory() {
    localStorage.removeItem(PRAC_HIST_KEY);
  }

  /* ══════════════════════════════════════════
     4. AGGREGATE STATS & TOPIC MASTERY
  ══════════════════════════════════════════ */

  function computeStats() {
    var mocks = allMockResults();
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
                          Math.round((overallCorrect / overallQuestionsAttempted) * 100) : 0;

    return {
      mock: mockStats,
      practice: practiceStats,
      overall: {
        questionsAttempted: overallQuestionsAttempted,
        correct: overallCorrect,
        accuracy: overallAccuracy
      }
    };
  }

  /* Compute per-topic mastery combining practice breakdown */
  function getTopicMastery() {
    var practice = loadPracticeHistory();
    var mastery = {};

    var allTopics = [];
    if (window.GATE_TOPICS && window.GATE_TOPICS.ALL) {
      allTopics = window.GATE_TOPICS.ALL;
    } else {
      allTopics = [
        { id: "geotech", name: "Geotechnical Engineering", icon: "⛰️", color: "#8d6e63" },
        { id: "structural", name: "Structural Engineering", icon: "🏛️", color: "#5c6bc0" },
        { id: "environmental", name: "Environmental Engineering", icon: "🌱", color: "#26a69a" },
        { id: "transportation", name: "Transportation Engineering", icon: "🛣️", color: "#ffa726" },
        { id: "surveying", name: "Surveying & Geomatics", icon: "📐", color: "#ab47bc" },
        { id: "fluids", name: "Fluid Mechanics & Hydraulics", icon: "💧", color: "#29b6f6" },
        { id: "hydrology", name: "Hydrology & Water Resources", icon: "🌊", color: "#00acc1" },
        { id: "rcc", name: "RCC & Prestressed Concrete", icon: "🧱", color: "#78909c" },
        { id: "steel", name: "Steel Structures", icon: "🏗️", color: "#66bb6a" },
        { id: "materials", name: "Construction Materials & Mgmt", icon: "📦", color: "#d4e157" },
        { id: "mechanics", name: "Engineering Mechanics & SOM", icon: "⚙️", color: "#ef5350" },
        { id: "irrigation", name: "Irrigation Engineering", icon: "🌾", color: "#9ccc65" },
        { id: "maths", name: "Engineering Mathematics", icon: "🔢", color: "#42a5f5" },
        { id: "aptitude", name: "General Aptitude", icon: "💡", color: "#ffca28" },
        { id: "general", name: "General Civil Engineering", icon: "📋", color: "#8e24aa" }
      ];
    }

    allTopics.forEach(function (t) {
      mastery[t.id] = {
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color,
        attempted: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        status: "untested"
      };
    });

    practice.forEach(function (session) {
      if (!session.topicBreakdown) return;
      Object.keys(session.topicBreakdown).forEach(function (topicKey) {
        var t = mastery[topicKey];
        if (!t) return;
        var b = session.topicBreakdown[topicKey];
        var total = b.total || 0;
        var corr = b.correct || 0;
        t.attempted += total;
        t.correct   += corr;
        t.wrong     += (total - corr);
      });
    });

    Object.keys(mastery).forEach(function (k) {
      var t = mastery[k];
      if (t.attempted > 0) {
        t.accuracy = Math.round((t.correct / t.attempted) * 100);
        if (t.accuracy >= 75) t.status = "strong";
        else if (t.accuracy >= 45) t.status = "average";
        else t.status = "weak";
      } else {
        t.status = "untested";
      }
    });

    return mastery;
  }

  /* ══════════════════════════════════════════
     5. BACKUP & RESET
  ══════════════════════════════════════════ */

  function exportAllData() {
    var data = {
      profile: loadProfile(),
      mockHistory: loadMockHistory(),
      practiceHistory: loadPracticeHistory(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  function resetAllData() {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(MOCK_HIST_KEY);
    localStorage.removeItem(PRAC_HIST_KEY);

    /* Also clear attempt states and results */
    var manifest = window.GATE_MANIFEST || [];
    manifest.forEach(function (entry) {
      localStorage.removeItem("gate-result-" + entry.year);
      localStorage.removeItem("gate-attempt-" + entry.year);
    });
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
    computeStats: computeStats,
    getTopicMastery: getTopicMastery,
    exportAllData: exportAllData,
    resetAllData: resetAllData
  };

})();

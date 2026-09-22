/* ============================================================
   GATE CE – Practice Mode State
   All papers are expected to be loaded before this file.
   ============================================================ */
(function () {

  /* ── collect all questions across all loaded papers ── */
  function getAllQuestions() {
    var all = [];
    var P = window.GATE_PAPERS || {};
    var seen = {};
    Object.keys(P).forEach(function (key) {
      var paper = P[key];
      if (!paper || !paper.questions) return;
      /* skip alias entries (same object reference) */
      if (seen[paper.title]) return;
      seen[paper.title] = true;
      paper.questions.forEach(function (q) {
        all.push({
          question: q,
          paper: paper,
          paperKey: key,
          topic: window.GATE_TOPICS.classify(q)
        });
      });
    });
    return all;
  }

  /* ── filter by topics array and year range ── */
  function filterQuestions(topics, years) {
    var all = getAllQuestions();
    return all.filter(function (item) {
      var yearOk = !years || !years.length || years.indexOf(String(item.paper.year || "").split("-")[0]) !== -1 ||
                   years.indexOf(String(item.paper.year)) !== -1;
      var topicOk = !topics || !topics.length || topics.indexOf(item.topic) !== -1;
      return yearOk && topicOk;
    });
  }

  /* ── shuffle array (Fisher-Yates) ── */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* ── session storage keys ── */
  var KEY_SESSION = "gate_practice_session";
  var KEY_RESPONSES = "gate_practice_responses";

  function saveSession(session) {
    sessionStorage.setItem(KEY_SESSION, JSON.stringify(session));
  }

  function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(KEY_SESSION)) || null; }
    catch (e) { return null; }
  }

  function saveResponses(responses) {
    sessionStorage.setItem(KEY_RESPONSES, JSON.stringify(responses));
  }

  function loadResponses() {
    try { return JSON.parse(sessionStorage.getItem(KEY_RESPONSES)) || {}; }
    catch (e) { return {}; }
  }

  function clearSession() {
    sessionStorage.removeItem(KEY_SESSION);
    sessionStorage.removeItem(KEY_RESPONSES);
  }

  window.GatePractice = {
    getAllQuestions: getAllQuestions,
    filterQuestions: filterQuestions,
    shuffle: shuffle,
    saveSession: saveSession,
    loadSession: loadSession,
    saveResponses: saveResponses,
    loadResponses: loadResponses,
    clearSession: clearSession
  };

})();

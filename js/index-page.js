(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("year-grid");
    if (!grid) return;

    renderGreeting();

    window.GATE_MANIFEST.forEach(function (entry) {
      var card = document.createElement("a");
      card.className = "year-card";
      card.href = "instructions.html?year=" + encodeURIComponent(entry.year);

      var hasSaved = false;
      try {
        var saved = JSON.parse(localStorage.getItem("gate_attempt_" + entry.year));
        hasSaved = saved && !saved.submitted;
      } catch (e) {}

      var title = document.createElement("div");
      title.className = "year-card-title";
      title.textContent = entry.label;

      var meta = document.createElement("div");
      meta.className = "year-card-meta";
      var qCount = entry.totalQuestions ? entry.totalQuestions + " Qs · " : "";
      meta.textContent = qCount + entry.durationMinutes + " min";

      var tag = document.createElement("span");
      tag.className = "year-card-tag";
      tag.textContent = hasSaved ? "▶ In Progress" : (entry.tag || "Mock Test");
      if (hasSaved) tag.style.cssText = "color:#ffca28;border-color:rgba(255,202,40,0.4);background:rgba(255,202,40,0.08)";

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(tag);

      var best = bestAttempt(entry.year);
      if (best) {
        var badge = document.createElement("span");
        badge.className = "year-card-score";
        badge.textContent = "Best " + round1(best.score) + "/" + (best.maxScore || 100);
        card.appendChild(badge);
      }

      grid.appendChild(card);
    });
  });

  function renderGreeting() {
    if (!window.GateProfile) return;
    var profile = window.GateProfile.load();
    if (!profile || !profile.name) return;

    var title = document.getElementById("hero-title");
    if (title) title.textContent = "Welcome back, " + profile.name.split(" ")[0] + "!";

    var sub = document.querySelector(".index-hero p");
    if (!sub) return;
    var stats = window.GateProfile.computeStats();
    if (!stats.mock.count && !stats.practice.sessions) return;

    var bits = [];
    if (stats.mock.count) bits.push(stats.mock.count + " mock test" + (stats.mock.count === 1 ? "" : "s"));
    if (stats.practice.sessions) bits.push(stats.practice.sessions + " practice session" + (stats.practice.sessions === 1 ? "" : "s"));
    sub.textContent = "Civil Engineering · " + bits.join(" and ") + " completed";
  }

  function bestAttempt(year) {
    if (!window.GateProfile) return null;
    var attempts = window.GateProfile.loadMockHistory().filter(function (m) { return m.year === year; });
    if (!attempts.length) return null;
    return attempts.reduce(function (best, m) { return m.score > best.score ? m : best; }, attempts[0]);
  }

  function round1(n) {
    return Math.round((Number(n) || 0) * 10) / 10;
  }

})();

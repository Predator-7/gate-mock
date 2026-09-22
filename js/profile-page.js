/* ============================================================
   GATE CE — Profile & Progress page
   ============================================================ */
(function () {

  document.addEventListener("DOMContentLoaded", function () {
    renderIdentity();
    renderKPIs();
    renderMastery();
    renderMockHistory();
    renderPracticeHistory();
    wireTabs();
    wireNameEditing();
    wireDataActions();
  });

  /* ───────────────────────────── Identity ───────────────────────────── */

  function renderIdentity() {
    var profile = window.GateProfile.load() || {};
    var name = (profile.name || "").trim() || "GATE Aspirant";

    document.getElementById("profile-name").textContent = name;
    document.getElementById("name-input").value = profile.name || "";

    var avatar = document.getElementById("avatar-lg");
    avatar.textContent = window.GateOnboarding.initials(name);
    avatar.style.background = window.GateOnboarding.avatarColor(name);

    var stats = window.GateProfile.computeStats();
    var since = profile.createdAt
      ? " Preparing since " + formatDate(profile.createdAt) + "."
      : "";
    document.getElementById("profile-sub").textContent =
      stats.mock.count + " mock test" + (stats.mock.count === 1 ? "" : "s") +
      " and " + stats.practice.sessions + " practice session" +
      (stats.practice.sessions === 1 ? "" : "s") + " recorded." + since;
  }

  function wireNameEditing() {
    var row = document.querySelector(".profile-name-row");
    var editBox = document.getElementById("profile-name-edit");
    var input = document.getElementById("name-input");

    document.getElementById("edit-name-btn").addEventListener("click", function () {
      row.classList.add("hidden");
      editBox.classList.remove("hidden");
      input.focus();
      input.select();
    });

    document.getElementById("cancel-name-btn").addEventListener("click", close);

    document.getElementById("save-name-btn").addEventListener("click", function () {
      var name = input.value.trim();
      if (name.length < 2) { input.focus(); return; }
      window.GateProfile.save({ name: name });
      close();
      renderIdentity();
      window.GateOnboarding.renderNavAvatar();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("save-name-btn").click();
      if (e.key === "Escape") close();
    });

    function close() {
      editBox.classList.add("hidden");
      row.classList.remove("hidden");
    }
  }

  /* ───────────────────────────── KPIs ───────────────────────────── */

  function renderKPIs() {
    var stats = window.GateProfile.computeStats();
    var c = stats.combined;

    setText("kpi-accuracy", c.accuracy == null ? "—" : c.accuracy + "%");
    setText("kpi-accuracy-foot", c.attempted
      ? c.correct + " of " + c.attempted + " answered correctly"
      : "No questions attempted yet");

    setText("kpi-mocks", stats.mock.count);
    setText("kpi-mocks-foot", stats.mock.count
      ? stats.mock.totalCorrect + " correct · " + stats.mock.totalWrong + " wrong"
      : "No mock tests yet");

    setText("kpi-practice", stats.practice.totalQuestions);
    setText("kpi-practice-foot", stats.practice.sessions
      ? "across " + stats.practice.sessions + " session" + (stats.practice.sessions === 1 ? "" : "s")
      : "No practice yet");

    setText("kpi-best", stats.mock.bestScore == null ? "—" : round1(stats.mock.bestScore) + " / 100");
    setText("kpi-best-foot", stats.mock.bestScore == null ? "Attempt a mock to set a baseline" : "Highest mock score");

    setText("kpi-avg", stats.mock.avgScore == null ? "—" : round1(stats.mock.avgScore) + " / 100");
    setText("kpi-avg-foot", stats.mock.avgScore == null ? "Attempt a mock to set a baseline" : "Across all attempts");
  }

  /* ───────────────────────────── Topic mastery ───────────────────────────── */

  function renderMastery() {
    var list = window.GateProfile.computeTopicMastery();
    var wrap = document.getElementById("mastery-list");
    wrap.innerHTML = "";

    list.forEach(function (t) {
      var pct = t.accuracy;
      var row = document.createElement("div");
      row.className = "mastery-row" + (pct == null ? " mastery-row--empty" : "");

      var meta = window.GATE_TOPICS.get(t.id);
      var color = pct == null ? "var(--surface3)" : accuracyColor(pct, meta.color);

      row.innerHTML =
        '<span class="mastery-icon">' + meta.icon + "</span>" +
        '<span class="mastery-name">' + escapeHtml(meta.name) + "</span>" +
        '<div class="mastery-track"><div class="mastery-fill" style="width:' +
          (pct == null ? 0 : pct) + "%;background:" + color + '"></div></div>' +
        '<span class="mastery-pct">' + (pct == null ? "—" : pct + "%") + "</span>" +
        '<span class="mastery-count">' + (t.total ? t.correct + "/" + t.total : "not attempted") + "</span>" +
        '<a class="mastery-practice" href="practice.html?topic=' +
          encodeURIComponent(t.id) + '">Practice</a>';

      wrap.appendChild(row);
    });
  }

  /* ───────────────────────────── Mock tests ───────────────────────────── */

  function renderMockHistory() {
    var history = window.GateProfile.loadMockHistory();
    var wrap = document.getElementById("mock-list");
    wrap.innerHTML = "";

    if (!history.length) {
      wrap.innerHTML =
        '<p class="empty-note">No mock tests recorded yet. ' +
        '<a href="index.html">Pick a paper to begin</a>.</p>';
      return;
    }

    history.forEach(function (m) {
      var attempted = m.correct + m.wrong;
      var acc = attempted ? Math.round(m.correct / attempted * 100) : null;

      var item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML =
        '<div class="hi-main">' +
          '<div class="hi-title">' + escapeHtml(m.label || m.year) + "</div>" +
          '<div class="hi-meta">' + formatDateTime(m.submittedAt) +
            (acc == null ? "" : " · " + acc + "% accuracy") + "</div>" +
        "</div>" +
        '<div class="hi-score">' + round1(m.score) + '<span> / ' + (m.maxScore || 100) + "</span></div>" +
        '<div class="hi-pills">' +
          '<span class="pill pill--correct">' + m.correct + " correct</span>" +
          '<span class="pill pill--wrong">' + m.wrong + " wrong</span>" +
          '<span class="pill pill--skip">' + m.unattempted + " skipped</span>" +
        "</div>" +
        '<div class="hi-actions">' +
          '<a class="review-btn" href="result.html?year=' + encodeURIComponent(m.year) + '">Review</a>' +
        "</div>";
      wrap.appendChild(item);
    });
  }

  /* ───────────────────────────── Practice ───────────────────────────── */

  function renderPracticeHistory() {
    var history = window.GateProfile.loadPracticeHistory();
    var wrap = document.getElementById("practice-list");
    wrap.innerHTML = "";

    if (!history.length) {
      wrap.innerHTML =
        '<p class="empty-note">No practice sessions yet. ' +
        '<a href="practice.html">Start topic-wise practice</a>.</p>';
      return;
    }

    history.forEach(function (s) {
      var attempted = (s.correct || 0) + (s.wrong || 0);
      var acc = attempted ? Math.round(s.correct / attempted * 100) : null;

      var topicNames = (s.topics || []).map(function (t) {
        return window.GATE_TOPICS.get(t.topic).name;
      });
      var shown = topicNames.slice(0, 3);
      var more = topicNames.length - shown.length;

      var item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML =
        '<div class="hi-main">' +
          '<div class="hi-title">' + (s.total || 0) + " question practice set</div>" +
          '<div class="hi-meta">' + formatDateTime(s.completedAt || s.id) +
            (acc == null ? "" : " · " + acc + "% accuracy") +
            (shown.length ? " · " + escapeHtml(shown.join(", ")) + (more > 0 ? " +" + more + " more" : "") : "") +
          "</div>" +
        "</div>" +
        '<div class="hi-pills">' +
          '<span class="pill pill--correct">' + (s.correct || 0) + " correct</span>" +
          '<span class="pill pill--wrong">' + (s.wrong || 0) + " wrong</span>" +
          '<span class="pill pill--skip">' + (s.skipped || 0) + " skipped</span>" +
        "</div>";
      wrap.appendChild(item);
    });
  }

  /* ───────────────────────────── Tabs ───────────────────────────── */

  function wireTabs() {
    var btns = document.querySelectorAll(".tab-btn");
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener("click", function () {
        Array.prototype.forEach.call(btns, function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        document.getElementById("tab-mock").classList.toggle("hidden", btn.dataset.tab !== "mock");
        document.getElementById("tab-practice").classList.toggle("hidden", btn.dataset.tab !== "practice");
      });
    });
  }

  /* ───────────────────────────── Data management ───────────────────────────── */

  function wireDataActions() {
    document.getElementById("export-btn").addEventListener("click", function () {
      var data = window.GateProfile.exportData();
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var profile = window.GateProfile.load() || {};
      var slug = (profile.name || "gatece").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      var a = document.createElement("a");
      a.href = url;
      a.download = slug + "-progress.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });

    document.getElementById("import-btn").addEventListener("click", function () {
      document.getElementById("import-file").click();
    });

    document.getElementById("import-file").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      e.target.value = ""; // allow re-picking the same file
      if (!file) return;

      var reader = new FileReader();
      reader.onerror = function () { window.alert("Could not read that file."); };
      reader.onload = function () {
        var check = window.GateProfile.validateImport(String(reader.result));
        if (!check.ok) { window.alert("Import failed: " + check.error); return; }

        var current = window.GateProfile.computeStats();
        var hasData = current.mock.count || current.practice.sessions;
        if (hasData) {
          var ok = window.confirm(
            "Import this backup?\n\nThis REPLACES your current progress in this browser." +
            "\nCurrent: " + current.mock.count + " mock tests, " +
            current.practice.sessions + " practice sessions."
          );
          if (!ok) return;
        }

        var res = window.GateProfile.importData(check.data);
        if (!res.ok) { window.alert("Import failed: " + res.error); return; }
        window.alert(
          "Import complete.\n\n" + res.counts.mocks + " mock tests and " +
          res.counts.practice + " practice sessions restored."
        );
        window.location.reload();
      };
      reader.readAsText(file);
    });

    document.getElementById("reset-btn").addEventListener("click", function () {
      var ok = window.confirm(
        "Reset all progress?\n\nThis permanently deletes your name, mock test history and practice sessions from this browser."
      );
      if (!ok) return;
      window.GateProfile.resetAll();
      window.location.href = "index.html";
    });
  }

  /* ───────────────────────────── Helpers ───────────────────────────── */

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function round1(n) {
    return Math.round((Number(n) || 0) * 10) / 10;
  }

  function accuracyColor(pct, fallback) {
    if (pct >= 70) return "var(--green)";
    if (pct >= 45) return "var(--amber)";
    if (pct > 0)   return "var(--red)";
    return fallback;
  }

  function formatDate(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  function formatDateTime(ts) {
    if (!ts) return "Date unknown";
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(s) {
    if (window.GateUtils && window.GateUtils.escapeHtml) return window.GateUtils.escapeHtml(String(s == null ? "" : s));
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

})();

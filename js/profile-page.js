/* ============================================================
   GATE CE — Profile & Progress Dashboard Controller (profile-page.js)
   ============================================================ */
(function () {

  var currentTopicFilter = "all";

  document.addEventListener("DOMContentLoaded", function () {
    initProfilePage();
  });

  function initProfilePage() {
    renderProfileHeader();
    renderKPIs();
    renderTopicMastery();
    renderMockHistory();
    renderPracticeHistory();
    updateDiskSyncUI();
    wireEventListeners();
  }

  /* ─────────────────────────────────────────────────────────────
     1. Profile Header
     ───────────────────────────────────────────────────────────── */
  function renderProfileHeader() {
    if (!window.GateProfile) return;
    var profile = window.GateProfile.load();
    var name = (profile && profile.name) ? profile.name.trim() : "GATE Aspirant";

    var nameEl = document.getElementById("hero-user-name");
    if (nameEl) nameEl.textContent = name;

    var avatarEl = document.getElementById("hero-avatar");
    if (avatarEl && window.GateOnboarding) {
      avatarEl.textContent = window.GateOnboarding.initials(name);
      avatarEl.style.background = window.GateOnboarding.avatarGradient(name);
    }

    var joinedEl = document.getElementById("badge-joined");
    if (joinedEl && profile && profile.createdAt) {
      var d = new Date(profile.createdAt);
      var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      joinedEl.textContent = "Prep Started " + monthNames[d.getMonth()] + " " + d.getFullYear();
    }

    /* Aspirant Level badge based on activity */
    var stats = window.GateProfile.computeStats();
    var levelEl = document.getElementById("badge-level");
    if (levelEl) {
      var totalQ = (stats.overall ? stats.overall.questionsAttempted : 0);
      if (totalQ >= 200) {
        levelEl.textContent = "🏆 Exam Ready Aspirant";
        levelEl.style.color = "#ffca28";
        levelEl.style.borderColor = "rgba(255,202,40,0.4)";
      } else if (totalQ >= 50) {
        levelEl.textContent = "🔥 Consistent Solver";
      } else {
        levelEl.textContent = "⚡ Active Aspirant";
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────
     2. KPIs
     ───────────────────────────────────────────────────────────── */
  function renderKPIs() {
    if (!window.GateProfile) return;
    var stats = window.GateProfile.computeStats();

    /* Overall Accuracy */
    var accEl = document.getElementById("kpi-overall-acc");
    var countsEl = document.getElementById("kpi-overall-counts");
    var barEl = document.getElementById("kpi-overall-bar");

    var overallAcc = stats.overall.accuracy || 0;
    accEl.textContent = overallAcc + "%";
    countsEl.textContent = stats.overall.correct + " / " + stats.overall.questionsAttempted + " correct answers";
    barEl.style.width = overallAcc + "%";

    /* Mock stats */
    var mockCountEl = document.getElementById("kpi-mock-count");
    var mockSubEl = document.getElementById("kpi-mock-sub");
    var mockTagEl = document.getElementById("kpi-mock-tag");

    mockCountEl.textContent = stats.mock.count;
    if (stats.mock.count > 0) {
      var avg = stats.mock.avgScore != null ? (Math.round(stats.mock.avgScore * 10) / 10) : 0;
      var best = stats.mock.bestScore != null ? (Math.round(stats.mock.bestScore * 10) / 10) : 0;
      mockSubEl.textContent = "Avg: " + avg + "/100 · Best: " + best + "/100";
      mockTagEl.textContent = stats.mock.count + " paper" + (stats.mock.count === 1 ? "" : "s") + " submitted";
    } else {
      mockSubEl.textContent = "No mock tests submitted yet";
      mockTagEl.textContent = "Ready to start full tests";
    }

    /* Practice stats */
    var pracQEl = document.getElementById("kpi-practice-q");
    var pracAccEl = document.getElementById("kpi-practice-acc");
    var pracTagEl = document.getElementById("kpi-practice-tag");

    pracQEl.textContent = stats.practice.totalQuestions;
    pracAccEl.textContent = "Accuracy: " + stats.practice.accuracy + "%";
    pracTagEl.textContent = stats.practice.sessions + " session" + (stats.practice.sessions === 1 ? "" : "s") + " completed";

    /* Topics covered */
    var mastery = window.GateProfile.getTopicMastery();
    var topicKeys = Object.keys(mastery);
    var activeTopics = topicKeys.filter(function(k) { return mastery[k].attempted > 0; }).length;

    var topActiveEl = document.getElementById("kpi-topics-active");
    var topSubEl = document.getElementById("kpi-topics-sub");
    topActiveEl.textContent = activeTopics + " / " + topicKeys.length;
    topSubEl.textContent = activeTopics === 0 ? "Civil Engineering Syllabus" : (activeTopics + " topics practiced");
  }

  /* ─────────────────────────────────────────────────────────────
     3. Topic Mastery Matrix
     ───────────────────────────────────────────────────────────── */
  function renderTopicMastery() {
    if (!window.GateProfile) return;
    var mastery = window.GateProfile.getTopicMastery();
    var grid = document.getElementById("topic-mastery-grid");
    if (!grid) return;
    grid.innerHTML = "";

    var keys = Object.keys(mastery);

    /* Filter if applicable */
    var filtered = keys.filter(function (k) {
      if (currentTopicFilter === "all") return true;
      return mastery[k].status === currentTopicFilter;
    });

    if (filtered.length === 0) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column: 1 / -1;">' +
        '<div class="empty-state-icon">🔍</div>' +
        '<p class="empty-state-title">No topics match this filter</p>' +
        '<p class="empty-state-sub">Try selecting a different filter above or practice more questions.</p>' +
        '</div>';
      return;
    }

    filtered.forEach(function (k) {
      var t = mastery[k];
      var card = document.createElement("div");
      card.className = "mastery-card";

      var badgeClass = "mastery-badge--" + t.status;
      var badgeText = t.status === "strong" ? "Strong (≥75%)" :
                      t.status === "average" ? "Moderate (45-74%)" :
                      t.status === "weak" ? "Needs Practice (<45%)" : "Untested";

      var barColor = t.status === "strong" ? "#4caf50" :
                     t.status === "average" ? "#ffb300" :
                     t.status === "weak" ? "#ef5350" : "#3a4060";

      card.innerHTML =
        '<div class="mastery-card-top">' +
          '<div class="mastery-topic-title-wrap">' +
            '<span class="mastery-topic-icon">' + (t.icon || "📚") + '</span>' +
            '<div class="mastery-topic-name">' + t.name + '</div>' +
          '</div>' +
          '<span class="mastery-badge ' + badgeClass + '">' + badgeText + '</span>' +
        '</div>' +
        '<div class="mastery-stats-row">' +
          '<span class="mastery-acc-text">' + (t.attempted > 0 ? (t.accuracy + "% Accuracy") : "No attempts") + '</span>' +
          '<span class="mastery-q-count">' + (t.attempted > 0 ? (t.correct + "/" + t.attempted + " correct") : "0 Qs") + '</span>' +
        '</div>' +
        '<div class="mastery-bar-wrap">' +
          '<div class="mastery-bar-fill" style="width:' + (t.attempted > 0 ? t.accuracy : 0) + '%; background:' + barColor + ';"></div>' +
        '</div>' +
        '<div class="mastery-card-actions">' +
          '<a href="practice.html?topic=' + encodeURIComponent(t.id) + '" class="mastery-practice-btn">' +
            '⚡ Practice Topic →' +
          '</a>' +
        '</div>';

      grid.appendChild(card);
    });
  }

  /* ─────────────────────────────────────────────────────────────
     4. History Tabs (Mock & Practice)
     ───────────────────────────────────────────────────────────── */
  function renderMockHistory() {
    if (!window.GateProfile) return;
    var list = document.getElementById("mock-history-list");
    var countBadge = document.getElementById("mock-history-count");
    if (!list) return;

    var mocks = window.GateProfile.allMockResults();
    if (countBadge) countBadge.textContent = mocks.length;

    if (mocks.length === 0) {
      list.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-icon">📝</div>' +
          '<h3 class="empty-state-title">No Mock Tests Taken Yet</h3>' +
          '<p class="empty-state-sub">Complete full-length GATE previous year papers (2015–2025) with exact examination timing and scoring.</p>' +
          '<a href="index.html" class="cta-btn cta-btn--primary" style="margin-top:8px;">Attempt a Mock Test →</a>' +
        '</div>';
      return;
    }

    list.innerHTML = "";
    mocks.forEach(function (m) {
      var card = document.createElement("div");
      card.className = "hist-card";

      var dateStr = m.submittedAt ? formatDate(m.submittedAt) : "Completed Paper";
      var scoreVal = Math.round(Number(m.score || 0) * 10) / 10;
      var maxVal = m.maxScore || 100;

      card.innerHTML =
        '<div class="hist-card-left">' +
          '<div class="hist-card-title">' + (m.label || ("GATE " + m.year + " Mock Test")) + '</div>' +
          '<div class="hist-card-meta">' +
            '<span>🗓️ ' + dateStr + '</span>' +
            '<span>⏱️ Full Paper</span>' +
          '</div>' +
        '</div>' +
        '<div class="hist-card-stats">' +
          '<div class="hist-breakdown">' +
            '<span class="hist-tag hist-tag--correct">✓ ' + (m.correct || 0) + '</span>' +
            '<span class="hist-tag hist-tag--wrong">✗ ' + (m.wrong || 0) + '</span>' +
            '<span class="hist-tag hist-tag--skip">○ ' + (m.unattempted || 0) + '</span>' +
          '</div>' +
          '<div class="hist-score-badge">' +
            '<span>' + scoreVal + ' / ' + maxVal + '</span>' +
            '<span class="hist-score-sub">' + (m.percentage || "0.0") + '% Marks</span>' +
          '</div>' +
          '<a href="result.html?year=' + encodeURIComponent(m.year) + '" class="hist-review-btn">View Analysis →</a>' +
        '</div>';

      list.appendChild(card);
    });
  }

  function renderPracticeHistory() {
    if (!window.GateProfile) return;
    var list = document.getElementById("practice-history-list");
    var countBadge = document.getElementById("practice-history-count");
    if (!list) return;

    var sessions = window.GateProfile.loadPracticeHistory();
    if (countBadge) countBadge.textContent = sessions.length;

    if (sessions.length === 0) {
      list.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-icon">⚡</div>' +
          '<h3 class="empty-state-title">No Practice Sets Recorded Yet</h3>' +
          '<p class="empty-state-sub">Select topics like Geotechnical, Structural, or Fluids to start topic-wise practice sets.</p>' +
          '<a href="practice.html" class="cta-btn cta-btn--secondary" style="margin-top:8px;">Start Topic Practice →</a>' +
        '</div>';
      return;
    }

    list.innerHTML = "";
    sessions.forEach(function (s) {
      var card = document.createElement("div");
      card.className = "hist-card";

      var dateStr = s.submittedAt ? formatDate(s.submittedAt) : "Practice Session";
      var topicsSummary = (s.topicNames && s.topicNames.length) ?
                          s.topicNames.slice(0, 3).join(", ") + (s.topicNames.length > 3 ? (" +" + (s.topicNames.length - 3) + " more") : "") :
                          "Mixed Topics";

      card.innerHTML =
        '<div class="hist-card-left">' +
          '<div class="hist-card-title">' + topicsSummary + '</div>' +
          '<div class="hist-card-meta">' +
            '<span>🗓️ ' + dateStr + '</span>' +
            '<span>⚡ ' + (s.total || 0) + ' Questions</span>' +
          '</div>' +
        '</div>' +
        '<div class="hist-card-stats">' +
          '<div class="hist-breakdown">' +
            '<span class="hist-tag hist-tag--correct">✓ ' + (s.correct || 0) + '</span>' +
            '<span class="hist-tag hist-tag--wrong">✗ ' + (s.wrong || 0) + '</span>' +
            '<span class="hist-tag hist-tag--skip">○ ' + (s.skipped || 0) + '</span>' +
          '</div>' +
          '<div class="hist-score-badge">' +
            '<span>' + (s.percentage || 0) + '%</span>' +
            '<span class="hist-score-sub">' + (Math.round(Number(s.score || 0) * 10) / 10) + ' Marks</span>' +
          '</div>' +
        '</div>';

      list.appendChild(card);
    });
  }

  /* ─────────────────────────────────────────────────────────────
     5. Date Formatting Helper
     ───────────────────────────────────────────────────────────── */
  function formatDate(ts) {
    try {
      var d = new Date(ts);
      var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var hours = d.getHours();
      var minutes = d.getMinutes();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      var minStr = minutes < 10 ? "0" + minutes : minutes;
      return monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " · " + hours + ":" + minStr + ampm;
    } catch(e) {
      return "Recent";
    }
  }

  /* ─────────────────────────────────────────────────────────────
     6. Event Listeners
     ───────────────────────────────────────────────────────────── */
  function wireEventListeners() {
    /* Filter pills */
    var filterContainer = document.getElementById("topic-filter-pills");
    if (filterContainer) {
      filterContainer.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-pill");
        if (!btn) return;
        filterContainer.querySelectorAll(".filter-pill").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentTopicFilter = btn.dataset.filter || "all";
        renderTopicMastery();
      });
    }

    /* History tabs */
    var tabMock = document.getElementById("tab-btn-mock");
    var tabPrac = document.getElementById("tab-btn-practice");
    var panelMock = document.getElementById("mock-history-panel");
    var panelPrac = document.getElementById("practice-history-panel");

    if (tabMock && tabPrac && panelMock && panelPrac) {
      tabMock.addEventListener("click", function () {
        tabMock.classList.add("active");
        tabPrac.classList.remove("active");
        panelMock.classList.remove("hidden");
        panelPrac.classList.add("hidden");
      });
      tabPrac.addEventListener("click", function () {
        tabPrac.classList.add("active");
        tabMock.classList.remove("active");
        panelPrac.classList.remove("hidden");
        panelMock.classList.add("hidden");
      });
    }

    /* Edit Name Modal */
    var editBtn = document.getElementById("edit-name-btn");
    var modal = document.getElementById("edit-name-modal");
    var cancelBtn = document.getElementById("cancel-edit-btn");
    var saveBtn = document.getElementById("save-name-btn");
    var input = document.getElementById("edit-name-input");

    if (editBtn && modal && cancelBtn && saveBtn && input) {
      editBtn.addEventListener("click", function () {
        var profile = window.GateProfile.load();
        input.value = (profile && profile.name) ? profile.name : "";
        modal.classList.remove("hidden");
        setTimeout(function() { input.focus(); }, 100);
      });

      cancelBtn.addEventListener("click", function () {
        modal.classList.add("hidden");
      });

      saveBtn.addEventListener("click", function () {
        var val = input.value.trim();
        if (val.length < 2) return;
        window.GateProfile.save({ name: val });
        modal.classList.add("hidden");
        renderProfileHeader();
        if (window.GateOnboarding) window.GateOnboarding.renderNavAvatar();
      });

      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") saveBtn.click();
        if (e.key === "Escape") modal.classList.add("hidden");
      });
    }

    /* Sync with File Button */
    var syncFileBtn = document.getElementById("sync-file-btn");
    if (syncFileBtn) {
      syncFileBtn.addEventListener("click", function () {
        if (!window.GateProfile || !window.GateProfile.syncWithDisk) return;
        syncFileBtn.textContent = "🔄 Syncing...";
        window.GateProfile.syncWithDisk(function (success) {
          syncFileBtn.textContent = "🔄 Sync with File";
          updateDiskSyncUI();
          if (success) {
            alert("✅ Successfully synchronized with userData.json on disk!");
          } else {
            alert("ℹ️ Local server is not currently reachable at /api/user-data.\n\nTo save data to userData.json, run:\n  node server.js\nor\n  python3 server.py\n\n(Browser localStorage is still actively preserving your progress).");
          }
        });
      });
    }

    /* Export JSON */
    var exportBtn = document.getElementById("export-data-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        var dataStr = window.GateProfile.exportAllData();
        var blob = new Blob([dataStr], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "gate-ce-progress-backup-" + new Date().toISOString().slice(0,10) + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    /* Reset Progress */
    var resetBtn = document.getElementById("reset-data-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        var confirmed = window.confirm("⚠️ Are you sure you want to reset all your test results, practice records, and progress? This cannot be undone.");
        if (confirmed) {
          window.GateProfile.resetAllData();
          initProfilePage();
          if (window.GateOnboarding) window.GateOnboarding.renderNavAvatar();
          alert("All progress data has been reset.");
        }
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     7. Disk Sync Status UI
     ───────────────────────────────────────────────────────────── */
  function updateDiskSyncUI() {
    var dot = document.getElementById("disk-sync-dot");
    var text = document.getElementById("disk-sync-text");
    if (!dot || !text || !window.GateProfile) return;

    var isActive = window.GateProfile.isDiskSyncActive ? window.GateProfile.isDiskSyncActive() : false;
    var lastSync = window.GateProfile.getLastDiskSyncTime ? window.GateProfile.getLastDiskSyncTime() : null;

    if (isActive) {
      dot.style.background = "#4caf50";
      dot.style.boxShadow = "0 0 8px rgba(76,175,80,0.6)";
      var timeStr = lastSync ? " (synced " + new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")" : "";
      text.innerHTML = "<strong>File Persistence Active:</strong> your progress is safely saved in <code style=\"color:var(--accent-b);\">userData.json</code>" + timeStr;
    } else {
      dot.style.background = "#42a5f5";
      dot.style.boxShadow = "none";
      text.innerHTML = "<strong>Browser Storage Active:</strong> run <code style=\"color:var(--accent-b);\">node server.js</code> or <code style=\"color:var(--accent-b);\">npm start</code> to auto-sync with <code style=\"color:var(--accent-b);\">userData.json</code>";
    }
  }

  window.addEventListener("gate:diskSynced", function () {
    renderProfileHeader();
    renderKPIs();
    renderTopicMastery();
    renderMockHistory();
    renderPracticeHistory();
    updateDiskSyncUI();
  });

  window.addEventListener("gate:diskSaved", function () {
    updateDiskSyncUI();
  });

})();

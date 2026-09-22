(function () {

  /* ── state ── */
  var session = null;       // loaded from sessionStorage
  var items = [];           // enriched items [{question, paper, topic}, ...]
  var responses = {};       // questionId → {selected|value, revealed, verdict, marksAwarded}
  var currentIdx = 0;
  var revealMode = false;   // has the current question been revealed?

  /* ── stats ── */
  var stats = { correct: 0, wrong: 0, skipped: 0, score: 0 };
  var recorded = false;    // session saved to profile already?

  document.addEventListener("DOMContentLoaded", function () {

    session = window.GatePractice.loadSession();
    if (!session || !session.items || !session.items.length) {
      document.getElementById("pexam-layout").innerHTML =
        '<div style="padding:48px;text-align:center;">' +
        '<h2>No practice session found.</h2>' +
        '<a href="practice.html" class="action-btn action-btn--primary">Start a Session</a></div>';
      return;
    }

    /* Rebuild items – look up question objects from loaded papers */
    items = session.items.map(function (s) {
      var paper = window.GATE_PAPERS[s.paperKey];
      if (!paper) return null;
      var question = paper.questions.find(function (q) { return q.id === s.questionId; });
      if (!question) return null;
      return { question: question, paper: paper, topic: s.topic, paperKey: s.paperKey };
    }).filter(Boolean);

    if (!items.length) {
      document.getElementById("pexam-layout").innerHTML =
        '<div style="padding:48px;text-align:center;"><h2>Could not load questions.</h2>' +
        '<a href="practice.html" class="action-btn action-btn--primary">Back to Practice</a></div>';
      return;
    }

    /* init responses */
    items.forEach(function (item) {
      responses[item.question.id] = { selected: null, value: null, revealed: false, verdict: null, marksAwarded: 0 };
    });

    /* wire buttons */
    document.getElementById("check-btn").addEventListener("click", onCheckAnswer);
    document.getElementById("next-btn").addEventListener("click", onNext);
    document.getElementById("prev-btn").addEventListener("click", onPrev);
    document.getElementById("skip-btn").addEventListener("click", onSkip);
    document.getElementById("finish-btn").addEventListener("click", onFinish);
    document.getElementById("review-btn").addEventListener("click", onReview);

    renderAll();
  });

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */

  function renderAll() {
    renderQuestion();
    renderSidebar();
    renderHeader();
  }

  /* ── Header & progress ── */
  function renderHeader() {
    var total = items.length;
    var done = items.filter(function (item) { return responses[item.question.id].revealed; }).length;
    var pct = total ? Math.round(done / total * 100) : 0;

    document.getElementById("pexam-progress-fill").style.width = pct + "%";
    document.getElementById("pexam-progress-label").textContent = done + " / " + total;
    document.getElementById("score-correct").textContent = stats.correct;
    document.getElementById("score-wrong").textContent = stats.wrong;
    document.getElementById("pexam-title").textContent = "Practice · " + total + " Questions";
  }

  /* ── Question ── */
  function renderQuestion() {
    var item = items[currentIdx];
    var q = item.question;
    var resp = responses[q.id];

    revealMode = resp.revealed;

    /* meta bar */
    document.getElementById("qmeta-pos").textContent =
      "Q " + (currentIdx + 1) + " of " + items.length;

    /* badges */
    var badgesEl = document.getElementById("qmeta-badges");
    badgesEl.innerHTML = "";
    if (session.showTopicTags !== false) {
      var topicMeta = window.GATE_TOPICS.get(item.topic);
      var tb = document.createElement("span");
      tb.className = "badge badge--topic";
      tb.style.setProperty("--badge-color", topicMeta.color);
      tb.textContent = topicMeta.icon + " " + topicMeta.name;
      badgesEl.appendChild(tb);

      var yr = document.createElement("span");
      yr.className = "badge badge--year";
      yr.textContent = "📅 " + (item.paper.year || item.paperKey);
      badgesEl.appendChild(yr);
    }
    var typeBadge = document.createElement("span");
    typeBadge.className = "badge badge--type";
    typeBadge.textContent = q.type;
    badgesEl.appendChild(typeBadge);

    /* marks */
    document.getElementById("qmeta-marks").textContent =
      q.marks + " mark" + (q.marks > 1 ? "s" : "") +
      (q.negativeMarks ? " / −" + Number(q.negativeMarks).toFixed(2) : "");

    /* render question */
    var container = document.getElementById("pexam-question-container");

    /* build response object for renderer */
    var rendererResp = null;
    if (q.type === "MCQ" && resp.selected) rendererResp = { selected: resp.selected };
    else if (q.type === "MSQ" && resp.selected) rendererResp = { selected: resp.selected };
    else if (q.type === "NAT") rendererResp = { value: resp.value };

    window.GateQuestionRenderer.render(container, q, rendererResp, function (val) {
      if (resp.revealed) return; /* locked after reveal */
      if (q.type === "MCQ" || q.type === "MSQ") {
        resp.selected = val;
      } else {
        resp.value = val;
      }
    });

    /* apply lock styling if revealed */
    container.classList.toggle("locked", revealMode);

    /* action buttons */
    var checkBtn = document.getElementById("check-btn");
    var nextBtn = document.getElementById("next-btn");
    var skipBtn = document.getElementById("skip-btn");

    if (revealMode) {
      checkBtn.classList.add("hidden");
      nextBtn.classList.remove("hidden");
      skipBtn.classList.add("hidden");
    } else {
      checkBtn.classList.remove("hidden");
      nextBtn.classList.add("hidden");
      skipBtn.classList.remove("hidden");
    }

    document.getElementById("prev-btn").disabled = currentIdx === 0;

    /* answer reveal panel */
    renderRevealPanel(item, resp);
  }

  function renderRevealPanel(item, resp) {
    var panel = document.getElementById("answer-reveal");
    panel.classList.toggle("visible", resp.revealed);

    if (!resp.revealed) return;

    var q = item.question;
    var verdict = resp.verdict || "unattempted";
    var verdictEl = document.getElementById("reveal-verdict");
    verdictEl.className = "reveal-verdict reveal-verdict--" + verdict;
    verdictEl.textContent = verdict === "correct" ? "✅ Correct!"
      : verdict === "wrong" ? "❌ Incorrect"
      : verdict === "skipped" ? "⏭️ Skipped"
      : "—";

    /* your answer */
    var yourAns = document.getElementById("reveal-your-ans");
    if (verdict === "skipped" || verdict === "unattempted") {
      yourAns.textContent = "Not attempted";
    } else if (q.type === "MCQ") {
      yourAns.textContent = resp.selected || "—";
    } else if (q.type === "MSQ") {
      yourAns.textContent = (resp.selected && resp.selected.length) ? resp.selected.join(", ") : "—";
    } else {
      yourAns.textContent = resp.value != null ? resp.value : "—";
    }

    /* correct answer */
    var corrAns = document.getElementById("reveal-correct-ans");
    corrAns.textContent = formatCorrectAnswer(q);

    /* marks */
    document.getElementById("reveal-marks").textContent =
      (resp.marksAwarded >= 0 ? "+" : "") + Number(resp.marksAwarded).toFixed(2);
  }

  /* ── Sidebar palette ── */
  function renderSidebar() {
    var palette = document.getElementById("pexam-palette");
    palette.innerHTML = "";

    items.forEach(function (item, idx) {
      var resp = responses[item.question.id];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = idx + 1;
      btn.className = "ppalette-btn";

      if (idx === currentIdx) btn.classList.add("active");

      if (resp.revealed) {
        if (resp.verdict === "correct") btn.classList.add("correct");
        else if (resp.verdict === "wrong") btn.classList.add("wrong");
        else btn.classList.add("skipped");
      }

      btn.addEventListener("click", function () {
        currentIdx = idx;
        renderAll();
      });
      palette.appendChild(btn);
    });
  }

  /* ════════════════════════════════════════════════
     ACTIONS
  ════════════════════════════════════════════════ */

  function onCheckAnswer() {
    var item = items[currentIdx];
    var q = item.question;
    var resp = responses[q.id];

    /* score it */
    var scoreResp = {};
    if (q.type === "MCQ") scoreResp = { selected: resp.selected };
    else if (q.type === "MSQ") scoreResp = { selected: resp.selected || [] };
    else scoreResp = { value: resp.value };

    var result = window.GateScoring.scoreQuestion(q, scoreResp);
    resp.revealed = true;
    resp.verdict = result.verdict;
    resp.marksAwarded = result.marks;

    /* update stats */
    recalcStats();

    renderAll();

    /* scroll reveal panel into view */
    setTimeout(function () {
      var panel = document.getElementById("answer-reveal");
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }

  function onSkip() {
    var item = items[currentIdx];
    var resp = responses[item.question.id];
    resp.revealed = true;
    resp.verdict = "skipped";
    resp.marksAwarded = 0;
    recalcStats();
    renderAll();
  }

  function onNext() {
    if (currentIdx < items.length - 1) {
      currentIdx++;
      renderAll();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onFinish();
    }
  }

  function onPrev() {
    if (currentIdx > 0) {
      currentIdx--;
      renderAll();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function onFinish() {
    /* auto-reveal any unrevealed questions */
    items.forEach(function (item) {
      var resp = responses[item.question.id];
      if (!resp.revealed) { resp.verdict = "skipped"; resp.marksAwarded = 0; resp.revealed = true; }
    });
    recalcStats();
    recordSession();
    renderSummary();
    document.getElementById("summary-overlay").classList.remove("hidden");
    renderSidebar();
    renderHeader();
  }

  /* Persist this session to the profile so progress accumulates. */
  function recordSession() {
    if (!window.GateProfile || !window.GateProfile.savePracticeSession) return;
    if (recorded) return;
    recorded = true;

    var topicMap = {};
    items.forEach(function (item) {
      var resp = responses[item.question.id];
      var t = item.topic;
      if (!topicMap[t]) topicMap[t] = { topic: t, correct: 0, wrong: 0, skipped: 0, total: 0 };
      topicMap[t].total++;
      if (resp.verdict === "correct") topicMap[t].correct++;
      else if (resp.verdict === "wrong") topicMap[t].wrong++;
      else topicMap[t].skipped++;
    });

    window.GateProfile.savePracticeSession({
      type: "practice",
      topics: Object.keys(topicMap).map(function (k) { return topicMap[k]; }),
      correct: stats.correct,
      wrong: stats.wrong,
      skipped: stats.skipped,
      score: stats.score,
      total: items.length,
      completedAt: Date.now()
    });
  }

  function onReview() {
    document.getElementById("summary-overlay").classList.add("hidden");
    currentIdx = 0;
    renderAll();
  }

  /* ════════════════════════════════════════════════
     STATS
  ════════════════════════════════════════════════ */

  function recalcStats() {
    stats = { correct: 0, wrong: 0, skipped: 0, score: 0 };
    items.forEach(function (item) {
      var resp = responses[item.question.id];
      if (!resp.revealed) return;
      if (resp.verdict === "correct") { stats.correct++; stats.score += resp.marksAwarded; }
      else if (resp.verdict === "wrong") { stats.wrong++; stats.score += resp.marksAwarded; }
      else stats.skipped++;
    });
  }

  /* ════════════════════════════════════════════════
     SUMMARY
  ════════════════════════════════════════════════ */

  function renderSummary() {
    document.getElementById("sum-correct").textContent = stats.correct;
    document.getElementById("sum-wrong").textContent = stats.wrong;
    document.getElementById("sum-skipped").textContent = stats.skipped;
    document.getElementById("sum-score").textContent = Number(stats.score).toFixed(1);

    var icon = stats.correct / items.length >= 0.7 ? "🏆"
             : stats.correct / items.length >= 0.4 ? "💪" : "📚";
    document.getElementById("summary-icon").textContent = icon;

    /* per-topic breakdown */
    var topicMap = {};
    items.forEach(function (item) {
      var t = item.topic;
      var resp = responses[item.question.id];
      if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0, topic: item.topic };
      topicMap[t].total++;
      if (resp.verdict === "correct") topicMap[t].correct++;
    });

    var topicsEl = document.getElementById("summary-topics");
    topicsEl.innerHTML = "<h3 class='sum-topic-title'>Topic Performance</h3>";
    Object.keys(topicMap).forEach(function (k) {
      var d = topicMap[k];
      var meta = window.GATE_TOPICS.get(d.topic);
      var pct = d.total ? Math.round(d.correct / d.total * 100) : 0;
      var row = document.createElement("div");
      row.className = "sum-topic-row";
      row.innerHTML =
        '<span class="sum-topic-icon" style="color:' + meta.color + '">' + meta.icon + '</span>' +
        '<span class="sum-topic-name">' + meta.name + '</span>' +
        '<div class="sum-topic-bar-wrap"><div class="sum-topic-bar" style="width:' + pct + '%;background:' + meta.color + '"></div></div>' +
        '<span class="sum-topic-score">' + d.correct + '/' + d.total + '</span>';
      topicsEl.appendChild(row);
    });
  }

  /* ════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════ */

  function formatCorrectAnswer(question) {
    if (question.isMTA || question.correctAnswer === "Marks to All") return "Marks to All (MTA)";
    if (question.type === "MSQ") {
      return Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : String(question.correctAnswer);
    }
    if (question.type === "NAT") {
      if (question.ranges && question.ranges.length) {
        return question.ranges.map(function (r) {
          return r[0] === r[1] ? String(r[0]) : (r[0] + " to " + r[1]);
        }).join(" OR ");
      }
      return question.tolerance != null
        ? question.correctAnswer + " ± " + question.tolerance
        : (question.correctAnswer != null ? String(question.correctAnswer) : "N/A");
    }
    return question.correctAnswer != null ? String(question.correctAnswer) : "N/A";
  }

})();

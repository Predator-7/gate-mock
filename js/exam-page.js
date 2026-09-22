(function () {
  var year, paper, calculator;

  document.addEventListener("DOMContentLoaded", function () {
    year = window.GateUtils.getQueryParam("year");
    paper = window.GATE_PAPERS[year];

    if (!paper) {
      document.getElementById("exam-root").innerHTML =
        "<p style=\"padding:24px; font-family:sans-serif;\">No paper found for year \"" +
        window.GateUtils.escapeHtml(year) +
        "\". <a href=\"index.html\">Back to years</a></p>";
      return;
    }

    window.GateState.init(paper, year);
    calculator = window.GateCalculator.init(document.getElementById("calculator-root"));

    document.getElementById("paper-title-header").textContent = paper.title;

    // Load Candidate Name
    var profile = (window.GateProfile && window.GateProfile.load) ? window.GateProfile.load() : null;
    var candidateName = (profile && profile.name) ? profile.name : "Candidate Name";
    var cNameEl = document.getElementById("ion-candidate-name");
    if (cNameEl) cNameEl.textContent = candidateName;
    var pNameEl = document.getElementById("palette-cand-name");
    if (pNameEl) pNameEl.textContent = candidateName;

    renderSectionTabs();
    renderAll();

    document.getElementById("save-next-btn").addEventListener("click", function () {
      var q = window.GateState.getCurrentQuestion();
      if (q) window.GateState.unmarkForReview(q.id);
      goNext();
    });
    document.getElementById("mark-review-btn").addEventListener("click", function () {
      var q = window.GateState.getCurrentQuestion();
      if (q) window.GateState.markForReview(q.id);
      goNext();
    });
    document.getElementById("clear-response-btn").addEventListener("click", function () {
      var q = window.GateState.getCurrentQuestion();
      window.GateState.clearResponse(q.id);
      renderAll();
    });
    document.getElementById("calc-open-btn").addEventListener("click", function () {
      calculator.open();
    });
    document.getElementById("submit-btn").addEventListener("click", function () {
      showConfirmModal(
        "Submit Examination",
        "Are you sure you want to submit the test? You cannot change your responses after final submission.",
        submitExam
      );
    });

    // Modal popup listeners
    var qpBtn1 = document.getElementById("qpaper-btn");
    var qpBtn2 = document.getElementById("side-qpaper-btn");
    if (qpBtn1) qpBtn1.addEventListener("click", showQuestionPaperModal);
    if (qpBtn2) qpBtn2.addEventListener("click", showQuestionPaperModal);

    var instBtn1 = document.getElementById("instructions-btn");
    var instBtn2 = document.getElementById("side-instructions-btn");
    if (instBtn1) instBtn1.addEventListener("click", showInstructionsModal);
    if (instBtn2) instBtn2.addEventListener("click", showInstructionsModal);

    var state = window.GateState.getState();
    window.GateTimer.start(state.endTimestamp, onTick, onExpire);
  });

  function goNext() {
    var state = window.GateState.getState();
    var questions = paper.questions;
    var idx = questions.findIndex(function (q) { return q.id === state.currentQuestionId; });
    var next = questions[idx + 1] || questions[idx];
    window.GateState.goToQuestion(next.id);
    renderAll();
  }

  function onTick(remainingSeconds) {
    var timerEl = document.getElementById("timer-display");
    if (timerEl) {
      timerEl.textContent = window.GateUtils.formatSecondsAsHms(remainingSeconds);
    }
    var timerBox = document.querySelector(".ion-timer-box");
    if (timerBox) {
      timerBox.classList.toggle("timer--warning", remainingSeconds <= 1800 && remainingSeconds > 600);
      timerBox.classList.toggle("timer--danger", remainingSeconds <= 600);
    }
  }

  function onExpire() {
    showConfirmModal(
      "Time is up",
      "The test duration has concluded. Your test will be submitted automatically.",
      submitExam,
      { hideCancel: true }
    );
  }

  function showConfirmModal(title, message, onConfirm, options) {
    options = options || {};
    var overlay = document.getElementById("modal-overlay");
    overlay.innerHTML =
      '<div class="modal-box">' +
      '<h3 class="modal-title"></h3>' +
      '<p class="modal-message"></p>' +
      '<div class="modal-actions">' +
      (options.hideCancel ? "" : '<button type="button" class="secondary-btn" id="modal-cancel-btn">Cancel</button>') +
      '<button type="button" class="danger-btn" id="modal-confirm-btn">Submit</button>' +
      "</div></div>";
    overlay.querySelector(".modal-title").textContent = title;
    overlay.querySelector(".modal-message").textContent = message;
    overlay.classList.remove("hidden");

    var cancelBtn = overlay.querySelector("#modal-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        overlay.classList.add("hidden");
      });
    }
    overlay.querySelector("#modal-confirm-btn").addEventListener("click", function () {
      overlay.classList.add("hidden");
      onConfirm();
    });
  }

  function showQuestionPaperModal() {
    var overlay = document.getElementById("modal-overlay");
    var html = '<div class="modal-box ion-popup-modal">' +
      '<div class="ion-popup-header">' +
      '<h3>Question Paper — ' + window.GateUtils.escapeHtml(paper.title) + '</h3>' +
      '<button type="button" class="ion-popup-close" id="qpaper-close-btn">&times;</button>' +
      '</div>' +
      '<div class="ion-popup-body">';

    paper.sections.forEach(function (sec) {
      html += '<h4 style="color:#1b3f79; border-bottom:2px solid #cbd5e1; padding-bottom:4px; margin-top:16px;">Section: ' + window.GateUtils.escapeHtml(sec.name) + '</h4>';
      var qs = paper.questions.filter(function (q) { return q.section === sec.id; });
      qs.forEach(function (q, idx) {
        html += '<div style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;">' +
          '<div style="font-weight:700; color:#1e3a8a; margin-bottom:4px;">Q.' + (idx + 1) + ' [' + q.type + ' · ' + q.marks + ' Mark' + (q.marks > 1 ? 's' : '') + ']</div>' +
          '<div>' + q.statement + '</div>';
        if (q.image) {
          html += '<img src="' + q.image + '" style="max-width:100%; margin:8px 0; border:1px solid #cbd5e1; border-radius:4px;">';
        }
        if (q.options && q.options.length > 0) {
          html += '<div style="margin-top:6px; display:grid; grid-template-columns:1fr 1fr; gap:6px;">';
          q.options.forEach(function (opt) {
            html += '<div style="font-size:13px; color:#334155;"><strong>(' + opt.id + ')</strong> ' + (opt.text || '') + '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
    });

    html += '</div></div>';
    overlay.innerHTML = html;
    overlay.classList.remove("hidden");
    overlay.querySelector("#qpaper-close-btn").addEventListener("click", function () {
      overlay.classList.add("hidden");
    });
  }

  function showInstructionsModal() {
    var overlay = document.getElementById("modal-overlay");
    overlay.innerHTML =
      '<div class="modal-box ion-popup-modal">' +
      '<div class="ion-popup-header">' +
      '<h3>Examination Instructions &amp; Marking Scheme</h3>' +
      '<button type="button" class="ion-popup-close" id="inst-close-btn">&times;</button>' +
      '</div>' +
      '<div class="ion-popup-body">' +
      '<p><strong>Total Duration:</strong> 180 minutes.</p>' +
      '<p><strong>General Guidelines:</strong></p>' +
      '<ul>' +
      '<li>The countdown clock in the top ribbon shows remaining examination time.</li>' +
      '<li>To answer a question, select your option and click <strong>Save &amp; Next</strong> to save the answer and move to the next question.</li>' +
      '<li>Click <strong>Mark for Review &amp; Next</strong> to save your answer (if selected) and flag it for review.</li>' +
      '<li>Click <strong>Clear Response</strong> to erase the selected answer for the current question.</li>' +
      '<li>You can navigate to any question directly by clicking on its number in the Question Palette.</li>' +
      '</ul>' +
      '<p><strong>Marking Scheme:</strong></p>' +
      '<ul>' +
      '<li><strong>Multiple Choice (MCQ):</strong> 1-mark Qs have -0.33 negative marking; 2-mark Qs have -0.67 negative marking.</li>' +
      '<li><strong>Multiple Select (MSQ):</strong> Full marks only if all correct options are selected. NO negative marking.</li>' +
      '<li><strong>Numerical Answer (NAT):</strong> Enter decimal value in accepted range. NO negative marking.</li>' +
      '</ul>' +
      '</div></div>';
    overlay.classList.remove("hidden");
    overlay.querySelector("#inst-close-btn").addEventListener("click", function () {
      overlay.classList.add("hidden");
    });
  }

  function submitExam() {
    var state = window.GateState.getState();
    var result = window.GateScoring.scorePaper(paper, state.responses);
    result.year = year;
    result.maxScore = (paper.sections || []).reduce(function (s, sec) {
      return s + (sec.totalMarks || 0);
    }, 0) || 100;
    result.submittedAt = Date.now();
    window.GateStorage.saveResult(year, result);
    if (window.GateProfile && window.GateProfile.recordMockResult) {
      window.GateProfile.recordMockResult(year, paper.title || ("GATE " + year), result);
    }
    window.GateState.finalizeAndClear();
    window.GateTimer.stop();
    window.location.href = "result.html?year=" + encodeURIComponent(year);
  }

  function renderSectionTabs() {
    var container = document.getElementById("section-tabs");
    container.innerHTML = "";
    paper.sections.forEach(function (s) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "section-tab";
      btn.textContent = s.name;
      btn.addEventListener("click", function () {
        window.GateState.switchSection(s.id);
        renderAll();
      });
      container.appendChild(btn);
    });
  }

  function renderAll() {
    var state = window.GateState.getState();
    var question = window.GateState.getCurrentQuestion();
    if (!question) return;

    document.querySelectorAll(".section-tab").forEach(function (btn, i) {
      btn.classList.toggle("active", paper.sections[i].id === state.currentSection);
    });

    var qContainer = document.getElementById("question-container");
    var response = state.responses[question.id];
    window.GateQuestionRenderer.render(qContainer, question, response, function (value) {
      window.GateState.setResponse(question.id, value);
      renderPaletteOnly();
    });

    document.getElementById("question-marks").textContent =
      question.marks + " mark" + (question.marks > 1 ? "s" : "") +
      (question.negativeMarks ? " (−" + question.negativeMarks.toFixed(2) + " if wrong)" : "");

    var sectionQuestions = window.GateState.getQuestionsInSection(state.currentSection);
    var idx = sectionQuestions.findIndex(function (q) { return q.id === question.id; });
    document.getElementById("question-position").textContent = "Question No. " + (idx + 1);

    var typeBadge = document.getElementById("question-type-badge");
    if (typeBadge) {
      var typeMap = {
        "MCQ": "Multiple Choice Question (MCQ)",
        "MSQ": "Multiple Select Question (MSQ)",
        "NAT": "Numerical Answer Type (NAT)"
      };
      typeBadge.textContent = typeMap[question.type] || (question.type + " Question");
    }

    var secHeader = document.getElementById("palette-section-header");
    if (secHeader) {
      var currentSec = paper.sections.find(function (s) { return s.id === state.currentSection; });
      secHeader.textContent = "SECTION : " + ((currentSec && currentSec.name) ? currentSec.name.toUpperCase() : "GENERAL");
    }

    renderPaletteOnly();
  }

  function updateLegendCounts() {
    var counts = {
      "not-visited": 0,
      "not-answered": 0,
      "answered": 0,
      "marked-review": 0,
      "answered-marked": 0
    };
    if (paper && paper.questions) {
      paper.questions.forEach(function (q) {
        var s = window.GateState.getPaletteState(q.id);
        if (counts[s] !== undefined) counts[s]++;
      });
    }
    for (var key in counts) {
      var el = document.getElementById("count-" + key);
      if (el) el.textContent = String(counts[key]);
    }
  }

  function renderPaletteOnly() {
    var state = window.GateState.getState();
    var sectionQuestions = window.GateState.getQuestionsInSection(state.currentSection);
    window.GatePalette.render(
      document.getElementById("palette-container"),
      sectionQuestions,
      state.currentQuestionId,
      function (qid) {
        window.GateState.goToQuestion(qid);
        renderAll();
      }
    );
    updateLegendCounts();
  }
})();

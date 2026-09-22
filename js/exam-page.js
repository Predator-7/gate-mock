(function () {
  var year, paper, calculator;

  document.addEventListener("DOMContentLoaded", function () {
    year = window.GateUtils.getQueryParam("year");
    paper = window.GATE_PAPERS[year];

    if (!paper) {
      document.getElementById("exam-root").innerHTML =
        "<p>No paper found for year \"" + window.GateUtils.escapeHtml(year) + "\". <a href=\"index.html\">Back to years</a></p>";
      return;
    }

    window.GateState.init(paper, year);
    calculator = window.GateCalculator.init(document.getElementById("calculator-root"));

    document.getElementById("paper-title-header").textContent = paper.title;

    renderSectionTabs();
    renderAll();

    document.getElementById("save-next-btn").addEventListener("click", function () {
      goNext();
    });
    document.getElementById("mark-review-btn").addEventListener("click", function () {
      var q = window.GateState.getCurrentQuestion();
      window.GateState.toggleMarkForReview(q.id);
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
        "Submit the test?",
        "You cannot change your answers after submitting.",
        submitExam
      );
    });

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
    document.getElementById("timer-display").textContent = window.GateUtils.formatSecondsAsHms(remainingSeconds);
  }

  function onExpire() {
    showConfirmModal(
      "Time is up",
      "The test will be submitted automatically.",
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
      '<button type="button" class="danger-btn" id="modal-confirm-btn">OK</button>' +
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
    document.getElementById("question-position").textContent = "Question " + (idx + 1) + " of " + sectionQuestions.length;

    renderPaletteOnly();
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
  }
})();

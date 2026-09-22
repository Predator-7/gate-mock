(function () {
  var current = null; // { year, paper, currentQuestionId, currentSection, responses, endTimestamp }

  function emptyResponse() {
    return { selected: null, value: null, visited: false, answered: false, markedForReview: false };
  }

  function persist() {
    window.GateStorage.saveAttempt(current.year, {
      year: current.year,
      currentQuestionId: current.currentQuestionId,
      currentSection: current.currentSection,
      responses: current.responses,
      endTimestamp: current.endTimestamp
    });
  }

  function init(paper, year) {
    var saved = window.GateStorage.loadAttempt(year);
    var responses = {};
    paper.questions.forEach(function (q) {
      responses[q.id] = emptyResponse();
    });

    if (saved && saved.responses) {
      Object.keys(saved.responses).forEach(function (qid) {
        if (responses[qid]) {
          responses[qid] = saved.responses[qid];
        }
      });
    }

    var endTimestamp = saved && saved.endTimestamp
      ? saved.endTimestamp
      : Date.now() + paper.durationMinutes * 60 * 1000;

    var firstQuestion = paper.questions[0];

    current = {
      year: year,
      paper: paper,
      currentQuestionId: (saved && saved.currentQuestionId) || (firstQuestion ? firstQuestion.id : null),
      currentSection: (saved && saved.currentSection) || (firstQuestion ? firstQuestion.section : null),
      responses: responses,
      endTimestamp: endTimestamp,
      hasSavedAttempt: !!saved
    };

    if (current.currentQuestionId && current.responses[current.currentQuestionId]) {
      current.responses[current.currentQuestionId].visited = true;
    }

    persist();
    return current;
  }

  function getState() {
    return current;
  }

  function getCurrentQuestion() {
    return current.paper.questions.find(function (q) { return q.id === current.currentQuestionId; }) || null;
  }

  function getQuestionsInSection(sectionId) {
    return current.paper.questions.filter(function (q) { return q.section === sectionId; });
  }

  function goToQuestion(qid) {
    current.currentQuestionId = qid;
    var q = current.paper.questions.find(function (qq) { return qq.id === qid; });
    if (q) current.currentSection = q.section;
    if (current.responses[qid]) current.responses[qid].visited = true;
    persist();
  }

  function switchSection(sectionId) {
    var questions = getQuestionsInSection(sectionId);
    if (questions.length === 0) return;
    current.currentSection = sectionId;
    goToQuestion(questions[0].id);
  }

  function setResponse(qid, value) {
    var r = current.responses[qid];
    if (!r) return;
    var q = current.paper.questions.find(function (qq) { return qq.id === qid; });
    if (q.type === "MSQ") {
      r.selected = value;
      r.answered = Array.isArray(value) && value.length > 0;
    } else if (q.type === "MCQ") {
      r.selected = value;
      r.answered = value != null;
    } else {
      r.value = value;
      r.answered = value != null && value !== "";
    }
    r.visited = true;
    persist();
  }

  function clearResponse(qid) {
    var r = current.responses[qid];
    if (!r) return;
    r.selected = null;
    r.value = null;
    r.answered = false;
    persist();
  }

  function toggleMarkForReview(qid) {
    var r = current.responses[qid];
    if (!r) return;
    r.markedForReview = !r.markedForReview;
    r.visited = true;
    persist();
  }

  function getPaletteState(qid) {
    var r = current.responses[qid];
    if (!r || !r.visited) return window.GateConfig.PALETTE_STATES.NOT_VISITED;
    if (r.answered && r.markedForReview) return window.GateConfig.PALETTE_STATES.ANSWERED_MARKED;
    if (r.markedForReview) return window.GateConfig.PALETTE_STATES.MARKED_REVIEW;
    if (r.answered) return window.GateConfig.PALETTE_STATES.ANSWERED;
    return window.GateConfig.PALETTE_STATES.NOT_ANSWERED;
  }

  function finalizeAndClear() {
    window.GateStorage.clearAttempt(current.year);
  }

  window.GateState = {
    init: init,
    getState: getState,
    getCurrentQuestion: getCurrentQuestion,
    getQuestionsInSection: getQuestionsInSection,
    goToQuestion: goToQuestion,
    switchSection: switchSection,
    setResponse: setResponse,
    clearResponse: clearResponse,
    toggleMarkForReview: toggleMarkForReview,
    getPaletteState: getPaletteState,
    finalizeAndClear: finalizeAndClear
  };
})();

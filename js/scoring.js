(function () {
  function scoreQuestion(question, response) {
    if (question.isMTA || question.correctAnswer === "MTA") {
      return { marks: question.marks, verdict: "correct" };
    }

    if (question.type === "MCQ") {
      if (response == null || response.selected == null) {
        return { marks: 0, verdict: "unattempted" };
      }
      var isCorrect = false;
      if (Array.isArray(question.correctAnswer)) {
        isCorrect = question.correctAnswer.indexOf(response.selected) !== -1;
      } else if (typeof question.correctAnswer === "string" && question.correctAnswer.indexOf(" OR ") !== -1) {
        var parts = question.correctAnswer.split(" OR ").map(function (p) { return p.trim(); });
        isCorrect = parts.indexOf(response.selected) !== -1;
      } else {
        isCorrect = response.selected === question.correctAnswer;
      }
      if (isCorrect) {
        return { marks: question.marks, verdict: "correct" };
      }
      return { marks: -question.negativeMarks, verdict: "wrong" };
    }

    if (question.type === "MSQ") {
      if (response == null || !Array.isArray(response.selected) || response.selected.length === 0) {
        return { marks: 0, verdict: "unattempted" };
      }
      if (window.GateUtils.arraysEqualAsSets(response.selected, question.correctAnswer)) {
        return { marks: question.marks, verdict: "correct" };
      }
      return { marks: 0, verdict: "wrong" };
    }

    if (question.type === "NAT") {
      if (response == null || response.value == null || response.value === "") {
        return { marks: 0, verdict: "unattempted" };
      }
      var val = Number(response.value);
      if (isNaN(val)) {
        return { marks: 0, verdict: "wrong" };
      }
      if (question.ranges && Array.isArray(question.ranges)) {
        for (var i = 0; i < question.ranges.length; i++) {
          var r = question.ranges[i];
          if (val >= r[0] && val <= r[1]) {
            return { marks: question.marks, verdict: "correct" };
          }
        }
        return { marks: 0, verdict: "wrong" };
      }
      var tolerance = question.tolerance || 0;
      var lo = question.correctAnswer - tolerance;
      var hi = question.correctAnswer + tolerance;
      if (val >= lo && val <= hi) {
        return { marks: question.marks, verdict: "correct" };
      }
      return { marks: 0, verdict: "wrong" };
    }

    return { marks: 0, verdict: "unattempted" };
  }

  function scorePaper(paper, responses) {
    var sectionScores = {};
    paper.sections.forEach(function (s) {
      sectionScores[s.id] = { id: s.id, name: s.name, score: 0, totalMarks: s.totalMarks };
    });

    var totalScore = 0;
    var totalCorrect = 0;
    var totalWrong = 0;
    var totalUnattempted = 0;
    var perQuestion = [];

    paper.questions.forEach(function (q) {
      var response = responses[q.id];
      var result = scoreQuestion(q, response);
      totalScore += result.marks;
      if (sectionScores[q.section]) {
        sectionScores[q.section].score += result.marks;
      }
      if (result.verdict === "correct") totalCorrect++;
      else if (result.verdict === "wrong") totalWrong++;
      else totalUnattempted++;

      perQuestion.push({
        id: q.id,
        section: q.section,
        marks: result.marks,
        verdict: result.verdict,
        response: response || null
      });
    });

    return {
      totalScore: totalScore,
      totalCorrect: totalCorrect,
      totalWrong: totalWrong,
      totalUnattempted: totalUnattempted,
      sectionScores: Object.keys(sectionScores).map(function (k) { return sectionScores[k]; }),
      perQuestion: perQuestion
    };
  }

  window.GateScoring = {
    scoreQuestion: scoreQuestion,
    scorePaper: scorePaper
  };
})();

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var year = window.GateUtils.getQueryParam("year");
    var paper = window.GATE_PAPERS[year];
    var result = window.GateStorage.loadResult(year);
    var root = document.getElementById("result-root");

    if (!paper || !result) {
      root.innerHTML =
        '<div style="text-align:center;padding:60px 24px;">' +
        '<h2 style="color:var(--text2)">No result found for "' + window.GateUtils.escapeHtml(year) + '"</h2>' +
        '<p style="color:var(--muted)">Complete a mock test first, then come back here.</p>' +
        '<a href="index.html" class="secondary-btn" style="margin-top:16px">← Back to Papers</a>' +
        '</div>';
      return;
    }

    var maxMarks = totalMarks(paper);

    /* Title */
    document.getElementById("result-title").textContent = paper.title;
    document.title = paper.title + " — Result";

    /* Score tiles */
    document.getElementById("total-score").textContent =
      result.totalScore.toFixed(2) + " / " + maxMarks;
    document.getElementById("correct-count").textContent = result.totalCorrect;
    document.getElementById("wrong-count").textContent = result.totalWrong;
    document.getElementById("unattempted-count").textContent = result.totalUnattempted;

    /* Accuracy bar */
    var attempted = result.totalCorrect + result.totalWrong;
    var accuracy = attempted > 0 ? Math.round(result.totalCorrect / attempted * 100) : 0;
    setTimeout(function () {
      document.getElementById("accuracy-bar").style.width = accuracy + "%";
    }, 200);
    document.getElementById("accuracy-pct").textContent = accuracy + "%";

    /* Section breakdown */
    var sectionTable = document.getElementById("section-breakdown");
    sectionTable.innerHTML = "";
    result.sectionScores.forEach(function (s) {
      var row = document.createElement("tr");
      var scoreNum = parseFloat(s.score);
      row.innerHTML =
        "<td>" + window.GateUtils.escapeHtml(s.name) + "</td>" +
        "<td>" + (s.correct || 0) + "</td>" +
        "<td>" + (s.wrong || 0) + "</td>" +
        "<td>" + (s.unattempted || 0) + "</td>" +
        "<td class='" + (scoreNum >= 0 ? "val-pos" : "val-neg") + "'>" +
          scoreNum.toFixed(2) + " / " + s.totalMarks + "</td>";
      sectionTable.appendChild(row);
    });

    /* Answer review */
    var reviewList = document.getElementById("answer-review");
    reviewList.innerHTML = "";
    result.perQuestion.forEach(function (pq, idx) {
      var question = paper.questions.find(function (q) { return q.id === pq.id; });
      if (!question) return;

      var item = document.createElement("div");
      item.className = "review-item review-" + pq.verdict;

      var verdictLabel = pq.verdict === "correct" ? "✅ Correct"
        : pq.verdict === "wrong" ? "❌ Wrong"
        : "— Unattempted";

      var imgHtml = question.image
        ? '<div><img src="' + question.image + '" style="max-width:100%;border-radius:6px;margin:8px 0;border:1px solid var(--border)"/></div>'
        : "";

      var stmtHtml = question.statement
        ? '<div class="review-statement">' + question.statement + '</div>'
        : (question.image ? "" : '<div class="review-statement" style="color:var(--muted);font-style:italic">Image-based question</div>');

      item.innerHTML =
        '<div class="review-header">' +
          '<span class="review-q-label">Q' + (idx + 1) + '</span>' +
          '<span class="review-verdict review-verdict--' + pq.verdict + '">' + verdictLabel + ' &nbsp;(' + pq.marks.toFixed(2) + ' marks)</span>' +
        '</div>' +
        stmtHtml +
        imgHtml +
        '<div class="review-answer-row">' +
          '<div class="review-your-answer">Your answer: <strong>' + formatAnswer(question, pq.response) + '</strong></div>' +
          '<div class="review-correct-answer">Correct: <strong>' + formatCorrectAnswer(question) + '</strong></div>' +
        '</div>';

      reviewList.appendChild(item);
    });
  });

  function totalMarks(paper) {
    return paper.sections.reduce(function (sum, s) { return sum + s.totalMarks; }, 0);
  }

  function formatAnswer(question, response) {
    if (!response) return "Not attempted";
    if (question.type === "MCQ") return response.selected || "Not attempted";
    if (question.type === "MSQ") return (response.selected && response.selected.length) ? response.selected.join(", ") : "Not attempted";
    if (question.type === "NAT") return (response.value != null && response.value !== "") ? response.value : "Not attempted";
    return "Not attempted";
  }

  function formatCorrectAnswer(question) {
    if (question.isMTA || question.correctAnswer === "MTA" || question.correctAnswer === "Marks to All") {
      return "Marks to All (MTA)";
    }
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

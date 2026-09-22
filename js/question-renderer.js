(function () {
  function render(container, question, response, onChange) {
    container.innerHTML = "";

    var statement = document.createElement("div");
    statement.className = "question-statement";
    statement.innerHTML = question.statement;
    container.appendChild(statement);

    if (question.image) {
      var img = document.createElement("img");
      img.src = question.image;
      img.className = "question-image";
      container.appendChild(img);
    }

    var body = document.createElement("div");
    body.className = "question-body";
    container.appendChild(body);

    if (question.type === "MCQ") {
      window.GateRenderMCQ.render(body, question, response, onChange);
    } else if (question.type === "MSQ") {
      window.GateRenderMSQ.render(body, question, response, onChange);
    } else if (question.type === "NAT") {
      window.GateRenderNAT.render(body, question, response, onChange);
    }
  }

  window.GateQuestionRenderer = { render: render };
})();

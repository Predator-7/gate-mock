(function () {
  function render(container, questions, currentQuestionId, onSelect) {
    container.innerHTML = "";
    questions.forEach(function (q, idx) {
      var btn = document.createElement("button");
      var state = window.GateState.getPaletteState(q.id);
      btn.type = "button";
      btn.className = "palette-cell palette-" + state;
      if (q.id === currentQuestionId) btn.classList.add("palette-current");
      btn.textContent = String(idx + 1);
      btn.setAttribute("aria-label", "Question " + (idx + 1) + " - " + state.replace("-", " "));
      btn.addEventListener("click", function () {
        onSelect(q.id);
      });
      container.appendChild(btn);
    });
  }

  window.GatePalette = { render: render };
})();

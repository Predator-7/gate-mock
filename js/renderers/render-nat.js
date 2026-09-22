(function () {
  function render(container, question, response, onChange) {
    var wrap = document.createElement("div");
    wrap.className = "nat-input-wrap";

    var input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "nat-input";
    input.placeholder = "Enter numeric answer";
    input.value = (response && response.value != null) ? response.value : "";
    input.addEventListener("input", function () {
      onChange(input.value === "" ? null : input.value);
    });

    wrap.appendChild(input);
    container.appendChild(wrap);
  }

  window.GateRenderNAT = { render: render };
})();

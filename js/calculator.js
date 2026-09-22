(function () {
  var expression = "";

  function init(root) {
    root.innerHTML =
      '<div class="calculator-modal hidden" id="calc-modal">' +
      '  <div class="calculator">' +
      '    <div class="calculator-header">' +
      '      <span>Calculator</span>' +
      '      <button type="button" id="calc-close">&times;</button>' +
      '    </div>' +
      '    <div class="calculator-display" id="calc-display">0</div>' +
      '    <div class="calculator-keys">' +
      "      " + keysHtml() +
      '    </div>' +
      '  </div>' +
      '</div>';

    var modal = root.querySelector("#calc-modal");
    var displayEl = root.querySelector("#calc-display");

    root.querySelector("#calc-close").addEventListener("click", function () {
      modal.classList.add("hidden");
    });

    root.querySelectorAll(".calc-key").forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleKey(btn.getAttribute("data-key"), displayEl);
      });
    });

    return {
      open: function () { modal.classList.remove("hidden"); },
      close: function () { modal.classList.add("hidden"); },
      toggle: function () { modal.classList.toggle("hidden"); }
    };
  }

  function keysHtml() {
    var keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","%","sqrt"];
    return keys.map(function (k) {
      return '<button type="button" class="calc-key" data-key="' + k + '">' + (k === "sqrt" ? "&radic;" : k) + "</button>";
    }).join("");
  }

  function handleKey(key, displayEl) {
    if (key === "C") {
      expression = "";
    } else if (key === "=") {
      try {
        // eslint-disable-next-line no-eval
        var result = Function('"use strict"; return (' + expression + ')')();
        expression = String(result);
      } catch (e) {
        expression = "Error";
      }
    } else if (key === "sqrt") {
      try {
        var val = Function('"use strict"; return (' + expression + ')')();
        expression = String(Math.sqrt(val));
      } catch (e) {
        expression = "Error";
      }
    } else if (key === "%") {
      try {
        var v = Function('"use strict"; return (' + expression + ')')();
        expression = String(v / 100);
      } catch (e) {
        expression = "Error";
      }
    } else {
      expression = expression === "Error" ? key : expression + key;
    }
    displayEl.textContent = expression || "0";
  }

  window.GateCalculator = { init: init };
})();

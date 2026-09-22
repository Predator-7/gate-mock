(function () {
  function render(container, question, response, onChange) {
    var list = document.createElement("div");
    list.className = "options-list";

    var opts = (question.options && question.options.length > 0)
      ? question.options
      : [
          { id: "A", text: "", image: null },
          { id: "B", text: "", image: null },
          { id: "C", text: "", image: null },
          { id: "D", text: "", image: null }
        ];

    opts.forEach(function (opt) {
      var label = document.createElement("label");
      label.className = "option-row";

      var input = document.createElement("input");
      input.type = "radio";
      input.name = "mcq-" + question.id;
      input.value = opt.id;
      input.checked = response && response.selected === opt.id;
      input.addEventListener("change", function () {
        onChange(opt.id);
      });

      var text = document.createElement("span");
      text.className = "option-text";
      text.innerHTML = "<strong>" + opt.id + ".</strong>" + (opt.text ? " " + opt.text : "");

      label.appendChild(input);
      label.appendChild(text);

      if (opt.image) {
        var img = document.createElement("img");
        img.src = opt.image;
        img.className = "option-image";
        label.appendChild(img);
      }

      list.appendChild(label);
    });

    container.appendChild(list);
  }

  window.GateRenderMCQ = { render: render };
})();

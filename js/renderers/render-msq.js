(function () {
  function render(container, question, response, onChange) {
    var list = document.createElement("div");
    list.className = "options-list";
    var selected = (response && Array.isArray(response.selected)) ? response.selected.slice() : [];

    question.options.forEach(function (opt) {
      var label = document.createElement("label");
      label.className = "option-row";

      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = opt.id;
      input.checked = selected.indexOf(opt.id) !== -1;
      input.addEventListener("change", function () {
        var idx = selected.indexOf(opt.id);
        if (input.checked && idx === -1) selected.push(opt.id);
        if (!input.checked && idx !== -1) selected.splice(idx, 1);
        onChange(selected.slice());
      });

      var text = document.createElement("span");
      text.className = "option-text";
      text.innerHTML = "<strong>" + opt.id + ".</strong> " + opt.text;

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

  window.GateRenderMSQ = { render: render };
})();

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var year = window.GateUtils.getQueryParam("year");
    var entry = window.GATE_MANIFEST.find(function (e) { return e.year === year; });

    if (!entry) {
      document.getElementById("instructions-root").innerHTML =
        "<p>No paper found for year \"" + window.GateUtils.escapeHtml(year) + "\". <a href=\"index.html\">Back to years</a></p>";
      return;
    }

    document.title = entry.label + " — Instructions";
    document.getElementById("paper-title").textContent = entry.label;
    document.getElementById("paper-duration").textContent = entry.durationMinutes;
    var dur2 = document.getElementById("paper-duration-2");
    if (dur2) dur2.textContent = entry.durationMinutes;
    var bc = document.getElementById("breadcrumb-paper");
    if (bc) bc.textContent = entry.label;

    var checkbox = document.getElementById("ack-checkbox");
    var startBtn = document.getElementById("start-btn");

    checkbox.addEventListener("change", function () {
      startBtn.disabled = !checkbox.checked;
    });

    var existingAttempt = window.GateStorage.loadAttempt(year);
    var resumeNotice = document.getElementById("resume-notice");
    var startFreshBtn = document.getElementById("start-fresh-btn");

    if (existingAttempt) {
      resumeNotice.classList.remove("hidden");
      startFreshBtn.classList.remove("hidden");
      startFreshBtn.addEventListener("click", function () {
        window.GateStorage.clearAttempt(year);
        resumeNotice.classList.add("hidden");
        startFreshBtn.classList.add("hidden");
      });
    }

    startBtn.addEventListener("click", function () {
      window.location.href = "exam.html?year=" + encodeURIComponent(year);
    });
  });
})();

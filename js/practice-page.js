(function () {

  /* ── state ── */
  var selectedTopics = new Set();
  var selectedYears = new Set();
  var shuffleOn = false;
  var showTopicTags = true;
  var allItems = [];
  var filteredItems = [];

  /* ── available years (derive from loaded papers) ── */
  var ALL_YEARS = ["2015","2017","2018","2019","2020","2021","2022","2023","2024","2025"];

  document.addEventListener("DOMContentLoaded", function () {

    /* collect all questions once */
    allItems = window.GatePractice.getAllQuestions();

    /* total count badge */
    document.getElementById("stat-total-q").textContent = allItems.length;

    /* build topic grid */
    buildTopicGrid();

    /* build year chips */
    buildYearChips();

    /* toggles */
    document.getElementById("shuffle-toggle").addEventListener("click", function () {
      shuffleOn = !shuffleOn;
      this.classList.toggle("active", shuffleOn);
      updatePreview();
    });
    document.getElementById("show-topic-toggle").addEventListener("click", function () {
      showTopicTags = !showTopicTags;
      this.classList.toggle("active", showTopicTags);
    });

    /* select all / clear all topics */
    document.getElementById("select-all-btn").addEventListener("click", function () {
      window.GATE_TOPICS.list.forEach(function (t) { selectedTopics.add(t.id); });
      document.querySelectorAll(".topic-card").forEach(function (c) { c.classList.add("selected"); });
      updatePreview();
    });
    document.getElementById("clear-all-btn").addEventListener("click", function () {
      selectedTopics.clear();
      document.querySelectorAll(".topic-card").forEach(function (c) { c.classList.remove("selected"); });
      updatePreview();
    });

    /* all years */
    document.getElementById("years-all-btn").addEventListener("click", function () {
      selectedYears.clear();
      document.querySelectorAll(".year-chip").forEach(function (c) { c.classList.remove("selected"); });
      updatePreview();
    });

    /* start */
    document.getElementById("start-practice-btn").addEventListener("click", startPractice);

    /* Check for topic pre-selection via URL parameter (e.g. from Profile page) */
    var params = new URLSearchParams(window.location.search);
    var topicParam = params.get("topic") || params.get("topics");
    if (topicParam) {
      var requestedTopics = topicParam.split(",").map(function(s){ return s.trim(); });
      selectedTopics.clear();
      document.querySelectorAll(".topic-card").forEach(function (c) {
        var tid = c.dataset.topic;
        if (requestedTopics.indexOf(tid) !== -1) {
          selectedTopics.add(tid);
          c.classList.add("selected");
        } else {
          c.classList.remove("selected");
        }
      });
      updatePreview();
      setTimeout(function() {
        var startBar = document.getElementById("start-bar");
        if (startBar) startBar.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }

    /* initial state – select all topics, all years */
    document.getElementById("select-all-btn").click();

    /* deep-link: ?topic=<id> preselects a single topic */
    applyTopicParam();

    updatePreview();
  });

  function applyTopicParam() {
    var topicId = window.GateUtils.getQueryParam("topic");
    if (!topicId) return;
    var known = window.GATE_TOPICS.list.some(function (t) { return t.id === topicId; });
    if (!known) return;

    document.getElementById("clear-all-btn").click();

    selectedTopics.add(topicId);
    document.querySelectorAll(".topic-card").forEach(function (c) {
      if (c.dataset.id === topicId) c.classList.add("selected");
    });

    var card = document.querySelector('.topic-card[data-id="' + topicId + '"]');
    if (card && card.scrollIntoView) card.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  /* ─────────────────────────────── Topic Grid ─────────────────────────────── */

  function buildTopicGrid() {
    var grid = document.getElementById("topic-grid");
    grid.innerHTML = "";

    window.GATE_TOPICS.list.forEach(function (topic) {
      var count = allItems.filter(function (item) { return item.topic === topic.id; }).length;

      var card = document.createElement("div");
      card.className = "topic-card";
      card.dataset.id = topic.id;
      card.style.setProperty("--topic-color", topic.color);

      card.innerHTML =
        '<div class="topic-icon">' + topic.icon + '</div>' +
        '<div class="topic-name">' + topic.name + '</div>' +
        '<div class="topic-count">' + count + ' questions</div>' +
        '<div class="topic-check"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="2,8 6.5,12.5 14,4"/></svg></div>';

      card.addEventListener("click", function () {
        if (selectedTopics.has(topic.id)) {
          selectedTopics.delete(topic.id);
          card.classList.remove("selected");
        } else {
          selectedTopics.add(topic.id);
          card.classList.add("selected");
        }
        updatePreview();
      });

      grid.appendChild(card);
    });
  }

  /* ─────────────────────────────── Year Chips ─────────────────────────────── */

  function buildYearChips() {
    var wrap = document.getElementById("year-chips");
    wrap.innerHTML = "";

    ALL_YEARS.forEach(function (yr) {
      var count = allItems.filter(function (item) {
        var py = String(item.paper.year || "").split("-")[0];
        return py === yr || String(item.paper.year) === yr;
      }).length;

      var chip = document.createElement("div");
      chip.className = "year-chip";
      chip.dataset.year = yr;
      chip.innerHTML = '<span class="year-chip-yr">' + yr + '</span><span class="year-chip-cnt">' + count + '</span>';

      chip.addEventListener("click", function () {
        if (selectedYears.has(yr)) {
          selectedYears.delete(yr);
          chip.classList.remove("selected");
        } else {
          selectedYears.add(yr);
          chip.classList.add("selected");
        }
        updatePreview();
      });

      wrap.appendChild(chip);
    });
  }

  /* ─────────────────────────────── Preview Count ─────────────────────────────── */

  function updatePreview() {
    var topics = Array.from(selectedTopics);
    var years = Array.from(selectedYears);
    filteredItems = window.GatePractice.filterQuestions(topics, years);

    var countEl = document.getElementById("summary-count");
    var btn = document.getElementById("start-practice-btn");

    countEl.textContent = filteredItems.length;
    btn.disabled = filteredItems.length === 0;

    /* animate count */
    countEl.classList.remove("bump");
    void countEl.offsetWidth;
    countEl.classList.add("bump");
  }

  /* ─────────────────────────────── Start ─────────────────────────────── */

  function startPractice() {
    var items = filteredItems.slice();
    if (shuffleOn) window.GatePractice.shuffle(items);

    /* Store session in sessionStorage – just store ids + metadata */
    var session = {
      items: items.map(function (item) {
        return {
          questionId: item.question.id,
          paperKey: item.paperKey,
          topic: item.topic
        };
      }),
      showTopicTags: showTopicTags,
      shuffled: shuffleOn,
      createdAt: Date.now()
    };

    /* Also store the full flattened question list for the exam page */
    try {
      sessionStorage.setItem("gate_practice_session", JSON.stringify(session));
      sessionStorage.removeItem("gate_practice_responses");
    } catch (e) {
      /* session might be too large; still navigate */
    }

    window.location.href = "practice-exam.html";
  }

})();

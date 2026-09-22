(function () {
  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function formatSecondsAsHms(totalSeconds) {
    var s = Math.max(0, Math.floor(totalSeconds));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    return pad(h) + ":" + pad(m) + ":" + pad(sec);
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function uid() {
    return "id-" + Math.random().toString(36).slice(2, 10);
  }

  function arraysEqualAsSets(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    var sa = a.slice().sort();
    var sb = b.slice().sort();
    for (var i = 0; i < sa.length; i++) {
      if (sa[i] !== sb[i]) return false;
    }
    return true;
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  window.GateUtils = {
    getQueryParam: getQueryParam,
    formatSecondsAsHms: formatSecondsAsHms,
    clamp: clamp,
    uid: uid,
    arraysEqualAsSets: arraysEqualAsSets,
    escapeHtml: escapeHtml
  };
})();

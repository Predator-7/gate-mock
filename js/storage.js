(function () {
  function key(prefix, year) {
    return prefix + year;
  }

  function safeGet(k) {
    try {
      var raw = window.localStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("GateStorage: read failed for", k, e);
      return null;
    }
  }

  function safeSet(k, value) {
    try {
      window.localStorage.setItem(k, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("GateStorage: write failed for", k, e);
      return false;
    }
  }

  function safeRemove(k) {
    try {
      window.localStorage.removeItem(k);
    } catch (e) {
      console.warn("GateStorage: remove failed for", k, e);
    }
  }

  var Prefixes = window.GateConfig;

  window.GateStorage = {
    saveAttempt: function (year, attemptState) {
      return safeSet(key(Prefixes.EXAM_STORAGE_PREFIX, year), attemptState);
    },
    loadAttempt: function (year) {
      return safeGet(key(Prefixes.EXAM_STORAGE_PREFIX, year));
    },
    clearAttempt: function (year) {
      safeRemove(key(Prefixes.EXAM_STORAGE_PREFIX, year));
    },
    saveResult: function (year, resultPayload) {
      return safeSet(key(Prefixes.RESULT_STORAGE_PREFIX, year), resultPayload);
    },
    loadResult: function (year) {
      return safeGet(key(Prefixes.RESULT_STORAGE_PREFIX, year));
    }
  };
})();

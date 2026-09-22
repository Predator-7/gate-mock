(function () {
  var intervalId = null;

  function start(endTimestamp, onTick, onExpire) {
    stop();
    function tick() {
      var remaining = Math.round((endTimestamp - Date.now()) / 1000);
      if (remaining <= 0) {
        onTick(0);
        stop();
        onExpire();
        return;
      }
      onTick(remaining);
    }
    tick();
    intervalId = window.setInterval(tick, 1000);
  }

  function stop() {
    if (intervalId != null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  window.GateTimer = { start: start, stop: stop };
})();

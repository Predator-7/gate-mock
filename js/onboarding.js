/* ============================================================
   GATE CE — Onboarding Modal + Nav Avatar & Profile Indicator
   Include this on every page after profile.js
   ============================================================ */
(function () {

  var COLORS = [
    "linear-gradient(135deg, #5c6bc0, #3949ab)",
    "linear-gradient(135deg, #7e57c2, #5e35b1)",
    "linear-gradient(135deg, #26a69a, #00897b)",
    "linear-gradient(135deg, #42a5f5, #1e88e5)",
    "linear-gradient(135deg, #66bb6a, #43a047)",
    "linear-gradient(135deg, #ef5350, #e53935)",
    "linear-gradient(135deg, #ffa726, #fb8c00)"
  ];

  function initials(name) {
    if (!name) return "G";
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function avatarGradient(name) {
    if (!name) return COLORS[0];
    var idx = 0;
    for (var i = 0; i < name.length; i++) idx += name.charCodeAt(i);
    return COLORS[idx % COLORS.length];
  }

  /* ── Inject styles ── */
  var style = document.createElement("style");
  style.id = "gate-onboarding-style";
  style.textContent = [
    /* Onboarding overlay */
    ".ob-overlay{position:fixed;inset:0;background:rgba(10,13,20,0.85);backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}",
    ".ob-card{background:var(--surface,#181c27);border:1px solid var(--border2,#384268);border-radius:20px;padding:36px;width:100%;max-width:440px;box-shadow:0 24px 60px rgba(0,0,0,0.7);animation:obIn .3s cubic-bezier(.22,1,.36,1);position:relative;text-align:center;}",
    "@keyframes obIn{from{opacity:0;transform:scale(.94) translateY(12px)}to{opacity:1;transform:none}}",
    ".ob-logo{font-size:42px;margin-bottom:12px;display:inline-block;animation:float 3s ease-in-out infinite;}",
    "@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}",
    ".ob-title{font-size:22px;font-weight:800;color:var(--text,#e8eaf6);margin:0 0 8px;letter-spacing:-0.02em;}",
    ".ob-sub{font-size:14px;color:var(--muted,#6b7ba4);margin:0 0 24px;line-height:1.5;}",
    ".ob-label{font-size:12px;font-weight:700;color:var(--text2,#b0b8d4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:block;text-align:left;}",
    ".ob-input{width:100%;background:var(--surface2,#1f2436);border:1.5px solid var(--border,#2c3454);border-radius:12px;padding:14px 16px;font-size:16px;font-weight:600;color:var(--text,#e8eaf6);outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;}",
    ".ob-input:focus{border-color:var(--accent,#5c6bc0);box-shadow:0 0 0 3px rgba(92,107,192,0.3);}",
    ".ob-input::placeholder{color:var(--muted,#6b7ba4);font-weight:400;}",
    ".ob-btn{width:100%;margin-top:18px;padding:14px;font-size:15px;font-weight:700;background:linear-gradient(135deg,var(--accent,#5c6bc0),#7986cb);color:#fff;border:none;border-radius:99px;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 16px rgba(92,107,192,0.35);}",
    ".ob-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none;}",
    ".ob-btn:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(92,107,192,0.5);}",
    ".ob-note{font-size:12px;color:var(--muted,#6b7ba4);margin-top:16px;display:flex;align-items:center;justify-content:center;gap:6px;}",

    /* Nav Avatar Button */
    ".nav-avatar-wrap{display:inline-flex;align-items:center;gap:8px;text-decoration:none;border-radius:99px;padding:4px 12px 4px 5px;background:var(--surface2,#1f2436);border:1px solid var(--border,#2c3454);transition:all .15s;flex-shrink:0;cursor:pointer;margin-left:6px;}",
    ".nav-avatar-wrap:hover{border-color:var(--border2,#384268);background:var(--surface3,#262d40);transform:translateY(-1px);}",
    ".nav-avatar-wrap.active{border-color:var(--accent,#5c6bc0);background:rgba(92,107,192,0.18);box-shadow:0 0 0 1px var(--accent,#5c6bc0);}",
    ".nav-avatar-badge{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);}",
    ".nav-avatar-name{font-size:13px;font-weight:600;color:var(--text,#e8eaf6);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".nav-profile-guest{font-size:13px;font-weight:600;color:var(--muted,#6b7ba4);}"
  ].join("");

  if (!document.getElementById("gate-onboarding-style")) {
    document.head.appendChild(style);
  }

  /* ── Render nav avatar across all page headers ── */
  function renderNavAvatar() {
    var existing = document.getElementById("nav-user-chip");
    if (existing) existing.remove();

    var nav = document.querySelector(".site-nav") ||
              document.querySelector(".nav-links") ||
              document.querySelector(".practice-nav .nav-links") ||
              document.querySelector(".pexam-header-right");
    if (!nav) return;

    var profile = window.GateProfile ? window.GateProfile.load() : null;
    var hasName = profile && profile.name && profile.name.trim();

    var isProfilePage = window.location.pathname.indexOf("profile.html") !== -1;

    var wrap = document.createElement("a");
    wrap.id = "nav-user-chip";
    wrap.href = "profile.html";
    wrap.className = "nav-avatar-wrap" + (isProfilePage ? " active" : "");
    wrap.title = hasName ? "Profile & Progress (" + profile.name + ")" : "Sign In / Profile";

    if (hasName) {
      var av = document.createElement("span");
      av.className = "nav-avatar-badge";
      av.style.background = avatarGradient(profile.name);
      av.textContent = initials(profile.name);

      var nm = document.createElement("span");
      nm.className = "nav-avatar-name";
      nm.textContent = profile.name.split(" ")[0]; // First name for compact nav

      wrap.appendChild(av);
      wrap.appendChild(nm);
    } else {
      var guestIcon = document.createElement("span");
      guestIcon.textContent = "👤";
      guestIcon.style.fontSize = "13px";

      var guestLabel = document.createElement("span");
      guestLabel.className = "nav-profile-guest";
      guestLabel.textContent = "Profile";

      wrap.appendChild(guestIcon);
      wrap.appendChild(guestLabel);
    }

    nav.appendChild(wrap);
  }

  /* ── Show onboarding modal ── */
  function showOnboarding(onDone) {
    var existingModal = document.getElementById("gate-onboarding-overlay");
    if (existingModal) existingModal.remove();

    var overlay = document.createElement("div");
    overlay.id = "gate-onboarding-overlay";
    overlay.className = "ob-overlay";
    overlay.innerHTML =
      '<div class="ob-card">' +
        '<div class="ob-logo">🎯</div>' +
        '<h2 class="ob-title">Welcome to GATE CE Prep!</h2>' +
        '<p class="ob-sub">Enter your name to get started. All your mock test scores, topic practice history, and performance analytics will be automatically saved.</p>' +
        '<label class="ob-label" for="ob-name-input">Your Full Name</label>' +
        '<input id="ob-name-input" class="ob-input" type="text" placeholder="e.g. Rahul Sharma" maxlength="40" autocomplete="name" autocorrect="off">' +
        '<button id="ob-submit-btn" class="ob-btn" disabled>Start Preparing →</button>' +
        '<p class="ob-note"><span>🔒</span> Saved locally on your device — no passwords required</p>' +
      '</div>';

    document.body.appendChild(overlay);

    var input = overlay.querySelector("#ob-name-input");
    var btn   = overlay.querySelector("#ob-submit-btn");

    input.addEventListener("input", function () {
      btn.disabled = input.value.trim().length < 2;
    });

    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !btn.disabled) btn.click();
    });

    btn.addEventListener("click", function () {
      var name = input.value.trim();
      if (name.length < 2) return;
      if (window.GateProfile) {
        window.GateProfile.save({ name: name });
      }
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity .25s ease-out";
      setTimeout(function () {
        overlay.remove();
        renderNavAvatar();
        // Dispatch custom event for pages that want to react to onboarding
        window.dispatchEvent(new CustomEvent("gate:profileUpdated", { detail: { name: name } }));
        if (onDone) onDone(name);
      }, 250);
    });

    setTimeout(function () { input.focus(); }, 120);
  }

  /* ── Init ── */
  function init() {
    renderNavAvatar();

    /* Don't show modal on profile.html or instructions.html (they handle inputs or exams) */
    var path = window.location.pathname;
    if (path.indexOf("profile.html") !== -1 ||
        path.indexOf("instructions.html") !== -1 ||
        path.indexOf("exam.html") !== -1 ||
        path.indexOf("practice-exam.html") !== -1) {
      return;
    }

    if (window.GateProfile && !window.GateProfile.isOnboarded()) {
      showOnboarding();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Expose helpers */
  window.GateOnboarding = {
    showOnboarding: showOnboarding,
    renderNavAvatar: renderNavAvatar,
    initials: initials,
    avatarGradient: avatarGradient
  };

})();

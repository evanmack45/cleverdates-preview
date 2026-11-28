(function () {
  var endpoint = (window.SOW && window.SOW.SIGNUP_ENDPOINT) ? String(window.SOW.SIGNUP_ENDPOINT).trim() : "";
  var form = document.getElementById("signup-form");
  var thanks = document.getElementById("signup-thanks");
  var note = document.getElementById("signup-note");
  var errorEl = document.getElementById("signup-error");
  var button = document.getElementById("signup-submit");
  var email = document.getElementById("signup-email");
  var referrer = document.getElementById("signup-referrer");
  if (!form || !button || !referrer) return;

  function refValue() {
    var fromQuery = (new URLSearchParams(window.location.search).get("ref") || "").trim();
    return fromQuery || "direct";
  }

  function pageUrlWithRef() {
    var url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    url.searchParams.set("ref", refValue());
    return url.toString();
  }

  function showThanks() {
    form.hidden = true;
    if (note) note.hidden = true;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
    if (thanks) thanks.hidden = false;
  }

  function showError(message) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    button.disabled = false;
  }

  referrer.value = pageUrlWithRef();

  if (!endpoint) {
    form.setAttribute("aria-disabled", "true");
    button.disabled = true;
    if (email) email.disabled = true;
    if (note) note.hidden = false;
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    return;
  }

  form.action = endpoint;
  form.method = "post";
  form.removeAttribute("aria-disabled");
  button.disabled = false;
  if (email) email.disabled = false;
  if (note) note.hidden = true;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
    if (!email || !email.value) return;
    button.disabled = true;
    referrer.value = pageUrlWithRef();

    var body = new URLSearchParams();
    body.set("email_address", email.value);
    body.set("referrer", referrer.value);

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Accept": "application/json"
      },
      body: body.toString()
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (err) { data = null; }
        // Kit's form guard: HTTP 200 with status "quarantined" and a challenge URL.
        if (data && data.status === "quarantined" && data.url) {
          window.location.assign(data.url);
          return;
        }
        if (res.ok) {
          showThanks();
          return;
        }
        showError("That signup didn't go through. Try again in a moment.");
      });
    }).catch(function () {
      // CORS or network: fall back to a normal form POST in a hidden iframe,
      // and be honest that we couldn't read Kit's response.
      // form.submit() does not fire this listener again.
      form.target = "signup-sink";
      form.submit();
      form.hidden = true;
      if (thanks) {
        thanks.textContent = "If the signup went through, check your email to confirm.";
        thanks.hidden = false;
      }
    });
  });
})();

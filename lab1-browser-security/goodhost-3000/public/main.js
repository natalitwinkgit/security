const authMessage = document.getElementById("authMessage");
const usernameLabel = document.getElementById("username");
const usernameInput = document.getElementById("usernameInput");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const scopeProbeButton = document.getElementById("scopeProbeButton");
const scopeProbeResult = document.getElementById("scopeProbeResult");
const runtimeSummary = document.getElementById("runtimeSummary");
const list = document.getElementById("emailList");
const subj = document.getElementById("emailSubject");
const body = document.getElementById("emailBody");
const runtimeConfig = {
  cookiePath: "/api",
  cookieSecurityMode: "secure",
  clientCookieMutable: false,
  logoutMode: "synchronized",
  sessionTtlMs: 0,
  sameSiteMode: "off",
  deleteMethod: "get",
  csrfMode: "off",
  csrfToken: null,
};

function setAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#9b1c1c" : "";
}

function clearEmailView(message = "Log in to load emails.") {
  list.replaceChildren();
  subj.textContent = "Select an email";
  body.textContent = message;
}

function renderEmails(emails) {
  list.replaceChildren();
  subj.textContent = "Select an email";
  body.textContent = "Choose an email from the list.";

  emails.forEach((email) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.gap = "12px";

    const preview = document.createElement("span");
    preview.style.cursor = "pointer";
    preview.textContent = `#${email.id} ${email.sender}: ${email.subject}`;
    preview.addEventListener("click", () => {
      subj.textContent = email.subject;
      body.textContent = email.body;
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteEmail(email.id);
    });

    li.appendChild(preview);
    li.appendChild(deleteButton);
    list.appendChild(li);
  });
}

function formatTtl(ttlMs) {
  if (ttlMs <= 0) {
    return "disabled";
  }

  if (ttlMs % 60000 === 0) {
    return `${ttlMs / 60000}m`;
  }

  return `${ttlMs / 1000}s`;
}

function renderRuntimeSummary() {
  if (!runtimeSummary) {
    return;
  }

  runtimeSummary.textContent =
    `Logout mode: ${runtimeConfig.logoutMode} | ` +
    `Cookie mode: ${runtimeConfig.cookieSecurityMode} | ` +
    `Cookie path: ${runtimeConfig.cookiePath} | ` +
    `TTL: ${formatTtl(runtimeConfig.sessionTtlMs)} | ` +
    `SameSite: ${runtimeConfig.sameSiteMode} | ` +
    `Delete: ${runtimeConfig.deleteMethod.toUpperCase()} | ` +
    `CSRF: ${runtimeConfig.csrfMode}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function loadRuntimeConfig() {
  const payload = await fetchJson("/api/runtime");
  Object.assign(runtimeConfig, payload);
  renderRuntimeSummary();
}

async function loadEmails() {
  const emails = await fetchJson("/api/emails");
  renderEmails(emails);
}

async function syncSession() {
  try {
    const payload = await fetchJson("/api/me");
    runtimeConfig.csrfToken = payload.csrfToken || null;
    usernameLabel.textContent = payload.user.displayName;
    setAuthMessage(`Logged in as ${payload.user.displayName}.`);
    await loadEmails();
  } catch (error) {
    if (error.status === 401) {
      runtimeConfig.csrfToken = null;
      usernameLabel.textContent = "Guest";
      clearEmailView();
      setAuthMessage(
        runtimeConfig.sessionTtlMs > 0
          ? "Use john or alice to create a session. Existing sessions may have expired."
          : "Use john or alice to create a session."
      );
      return;
    }

    console.error(error);
    setAuthMessage(error.message, true);
  }
}

async function deleteEmail(emailId) {
  try {
    if (runtimeConfig.deleteMethod === "post") {
      await fetchJson(`/api/emails/delete/${emailId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _csrf_token: runtimeConfig.csrfToken,
        }),
      });
    } else {
      await fetchJson(`/api/emails/delete/${emailId}`);
    }

    await syncSession();
    setAuthMessage(`Email #${emailId} deleted.`);
  } catch (error) {
    console.error(error);
    setAuthMessage(error.message, true);
  }
}

async function login() {
  const username = usernameInput.value.trim().toLowerCase();

  if (!username) {
    setAuthMessage("Enter john or alice first.", true);
    return;
  }

  try {
    await fetchJson(`/login?username=${encodeURIComponent(username)}`);
    usernameInput.value = "";
    await syncSession();
  } catch (error) {
    console.error(error);
    setAuthMessage(error.message, true);
  }
}

function clearSessionCookie() {
  if (!runtimeConfig.clientCookieMutable) {
    return;
  }

  document.cookie = `SessionID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${runtimeConfig.cookiePath};`;
}

async function logout() {
  try {
    if (runtimeConfig.logoutMode === "synchronized") {
      await fetchJson("/api/logout");
    }

    clearSessionCookie();
  } catch (error) {
    console.error(error);
    setAuthMessage(error.message, true);
    return;
  }

  usernameLabel.textContent = "Guest";
  clearEmailView();
  setAuthMessage("You are logged out.");
  window.location.reload();
}

async function probeOtherPath() {
  try {
    const payload = await fetchJson("/other");
    scopeProbeResult.textContent = JSON.stringify(payload, null, 2);
  } catch (error) {
    console.error(error);
    scopeProbeResult.textContent = error.message;
  }
}

loginButton.addEventListener("click", () => {
  login();
});

logoutButton.addEventListener("click", () => {
  logout();
});

scopeProbeButton.addEventListener("click", () => {
  probeOtherPath();
});

usernameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    login();
  }
});

scopeProbeResult.textContent =
  'Use this button to see whether the browser sends SessionID to "/other".';
clearEmailView();

async function bootstrap() {
  try {
    await loadRuntimeConfig();
  } catch (error) {
    console.error(error);
    renderRuntimeSummary();
  }

  await syncSession();
}

bootstrap();

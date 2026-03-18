const authMessage = document.getElementById("authMessage");
const usernameLabel = document.getElementById("username");
const usernameInput = document.getElementById("usernameInput");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const scopeProbeButton = document.getElementById("scopeProbeButton");
const scopeProbeResult = document.getElementById("scopeProbeResult");
const list = document.getElementById("emailList");
const subj = document.getElementById("emailSubject");
const body = document.getElementById("emailBody");

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
    li.style.cursor = "pointer";
    li.textContent = `${email.sender}: ${email.subject}`;
    li.addEventListener("click", () => {
      subj.textContent = email.subject;
      body.textContent = email.body;
    });
    list.appendChild(li);
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function loadEmails() {
  const emails = await fetchJson("/api/emails");
  renderEmails(emails);
}

async function syncSession() {
  try {
    const payload = await fetchJson("/api/me");
    usernameLabel.textContent = payload.user.displayName;
    setAuthMessage(`Logged in as ${payload.user.displayName}.`);
    await loadEmails();
  } catch (error) {
    if (error.status === 401) {
      usernameLabel.textContent = "Guest";
      clearEmailView();
      setAuthMessage("Use john or alice to create a session.");
      return;
    }

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

async function logout() {
  try {
    await fetchJson("/logout");
  } catch (error) {
    console.error(error);
  }

  usernameLabel.textContent = "Guest";
  clearEmailView();
  setAuthMessage("You are logged out.");
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
syncSession();

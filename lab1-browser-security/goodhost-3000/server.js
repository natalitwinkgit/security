const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

const configPath = path.join(__dirname, "config.json");
const versionPath = path.join(__dirname, "version.txt");
const indexPath = path.join(__dirname, "public", "index.html");
const trustedCdnOrigin = "http://localhost:7000";
const reactMockUrl = `${trustedCdnOrigin}/react-mock.js`;
const reactMockScriptPattern =
  /<script\s+src="http:\/\/localhost:7000\/react-mock\.js"[\s\S]*?<\/script>/m;

const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const version = fs.readFileSync(versionPath, "utf-8").trim();
const allowAllCors = cors();
const balancedModes = new Set([
  "csp-balanced",
  "mode-insecure",
  "mode-sri-active",
]);
const sessionCookieAttributes = ["Path=/api", "HttpOnly", "Secure"];
const users = {
  john: {
    username: "john",
    displayName: "John Smith",
    emails: [
      {
        id: 1,
        sender: "alice@mail.com",
        subject: "Welcome",
        body: "Hello John, welcome to SecureMail!",
      },
      {
        id: 2,
        sender: "boss@company.com",
        subject: "Meeting",
        body: "Reminder: meeting at 10:00.",
      },
    ],
  },
  alice: {
    username: "alice",
    displayName: "Alice Johnson",
    emails: [
      {
        id: 1,
        sender: "hr@company.com",
        subject: "Benefits Update",
        body: "Alice, please review the updated benefits package.",
      },
      {
        id: 2,
        sender: "john@mail.com",
        subject: "Coffee",
        body: "Can we sync after lunch about the new project?",
      },
    ],
  },
};
const sessions = new Map();

console.log(`[System] Starting ${config.appName} v${version}...`);

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((result, chunk) => {
      const separatorIndex = chunk.indexOf("=");

      if (separatorIndex === -1) {
        return result;
      }

      const key = chunk.slice(0, separatorIndex);
      const value = chunk.slice(separatorIndex + 1);
      result[key] = decodeURIComponent(value);
      return result;
    }, {});
}

function buildSessionCookie(sessionId) {
  return [`SessionID=${encodeURIComponent(sessionId)}`, ...sessionCookieAttributes].join(
    "; "
  );
}

function buildExpiredSessionCookie() {
  return [
    "SessionID=",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    ...sessionCookieAttributes,
  ].join("; ");
}

function createSession(username) {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, username);
  return sessionId;
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.SessionID;
  const username = sessionId ? sessions.get(sessionId) : null;

  if (!sessionId || !username) {
    return null;
  }

  return {
    sessionId,
    user: users[username],
  };
}

function getReactMockScriptTag() {
  if (config.mode === "mode-sri-active") {
    return [
      "<script",
      `  src="${reactMockUrl}"`,
      `  integrity="${config.reactMockSri}"`,
      '  crossorigin="anonymous">',
      "</script>",
    ].join("\n");
  }

  return `<script src="${reactMockUrl}"></script>`;
}

app.use((req, res, next) => {
  if (config.mode === "mode1") {
    return allowAllCors(req, res, next);
  }

  next();
});

app.use((req, res, next) => {
  if (config.mode === "csp-strict") {
    res.setHeader("Content-Security-Policy", "default-src 'self';");
  }

  if (balancedModes.has(config.mode)) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src *; style-src *; script-src 'self' http://localhost:4000 http://localhost:5000 http://localhost:7000;"
    );
  }

  next();
});

app.get(["/", "/index.html"], (req, res) => {
  const html = fs
    .readFileSync(indexPath, "utf-8")
    .replace(reactMockScriptPattern, getReactMockScriptTag());

  res.type("html").send(html);
});

app.use(express.static("public", { index: false }));

app.get("/login", (req, res) => {
  const username = String(req.query.username || "").trim().toLowerCase();
  const user = users[username];

  if (!user) {
    return res.status(400).json({
      error: "Unknown user. Use john or alice.",
    });
  }

  const currentSession = getSession(req);
  if (currentSession) {
    sessions.delete(currentSession.sessionId);
  }

  const sessionId = createSession(username);
  res.setHeader("Set-Cookie", buildSessionCookie(sessionId));
  return res.json({
    message: "Login successful.",
    user: {
      username: user.username,
      displayName: user.displayName,
    },
  });
});

app.get("/logout", (req, res) => {
  res.redirect("/api/logout");
});

app.get("/api/logout", (req, res) => {
  const session = getSession(req);

  if (session) {
    sessions.delete(session.sessionId);
  }

  res.setHeader("Set-Cookie", buildExpiredSessionCookie());
  return res.json({
    message: "Logout successful.",
  });
});

app.get("/api/me", (req, res) => {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  return res.json({
    user: {
      username: session.user.username,
      displayName: session.user.displayName,
    },
  });
});

app.get("/api/emails", (req, res) => {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  return res.json(session.user.emails);
});

app.get("/other", (req, res) => {
  res.json({
    path: "/other",
    receivedCookie: Boolean(req.headers.cookie),
    cookieHeader: req.headers.cookie || null,
  });
});

app.listen(3000, () => {
  console.log("GoodHost running on http://localhost:3000");
});

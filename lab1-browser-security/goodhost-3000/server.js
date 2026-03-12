const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

const configPath = path.join(__dirname, "config.json");
const versionPath = path.join(__dirname, "version.txt");

const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const version = fs.readFileSync(versionPath, "utf-8").trim();
const balancedModes = new Set([
  "csp-balanced",
  "mode-insecure",
  "mode-sri-active",
]);

console.log(`[System] Starting ${config.appName} v${version}...`);

app.use((req, res, next) => {
  if (config.mode === "csp-strict") {
    res.setHeader("Content-Security-Policy", "default-src 'self';");
  }

  if (balancedModes.has(config.mode)) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src *; style-src *; script-src 'self' http://localhost:4000 http://localhost:6000;"
    );
  }

  next();
});

app.use(express.static("public"));

const emails = [
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
];

app.get("/api/emails", (req, res) => {
  res.json(emails);
});

app.listen(3000, () => {
  console.log("GoodHost running on http://localhost:3000");
});

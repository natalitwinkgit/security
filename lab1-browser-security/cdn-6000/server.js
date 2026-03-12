const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const publicDir = path.join(__dirname, "public");
const configPath = path.join(__dirname, "config.json");
const reactMockPath = path.join(publicDir, "react-mock.js");
const breachedScript = 'alert("CRITICAL: CDN Compromised! Stealing data...");\n';

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

app.get("/react-mock.js", (req, res) => {
  const config = readConfig();

  res.type("application/javascript");

  if (config.mode === "breach") {
    return res.send(breachedScript);
  }

  return res.sendFile(reactMockPath);
});

app.use(express.static(publicDir));

[6000, 7000].forEach((port) => {
  app.listen(port, () => {
    console.log(`CDN running on http://localhost:${port}`);
  });
});

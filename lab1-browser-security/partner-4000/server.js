const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const allowAllCors = cors();

app.use((req, res, next) => {
  if (config.mode === "mode1") {
    return allowAllCors(req, res, next);
  }

  next();
});

app.use(express.static("public"));

app.get("/messages", (req, res) => {
  res.json({ newMessages: 0 });
});

app.listen(4000, () => {
  console.log("Partner running on http://localhost:4000");
});

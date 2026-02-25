const express = require("express");
const app = express();

const modeArg = process.argv.find((a) => a.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : "normal";

app.get("/weather.js", (req, res) => {
  res.type("application/javascript");

  if (mode === "breach1") {
    res.send(
      "alert(\"HACKED: I can see your cookies: \" + document.cookie + \" and User: \" + document.getElementById('username').innerText);"
    );
  } else {
    res.send('console.log("Weather: 12°C");');
  }
});

app.listen(5000, () => {
  console.log("Weather running on http://localhost:5000 (mode=" + mode + ")");
});

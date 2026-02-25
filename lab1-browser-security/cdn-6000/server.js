const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.listen(7000, () => {
  console.log("CDN running on http://localhost:7000");
});
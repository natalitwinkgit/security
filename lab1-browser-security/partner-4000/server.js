const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/messages", (req, res) => {
  res.json({ newMessages: 0 });
});

app.listen(4000, () => {
  console.log("Partner running on http://localhost:4000");
});
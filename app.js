const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const getDefinitions = require("./wordnet");

app.get('/api/definition', (req, res) => {
  const word = req.query.word;
  if (typeof word !== "string" || !word.trim()) {
      return res.status(400).send("No word provided");
  }

  const definitions = getDefinitions(word);
  if (definitions.length === 0) {
      return res.status(404).send("Definition not found");
  }

  res.send(definitions.map((definition, index) => `${index + 1}. ${definition}`).join(" "));
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const axios = require('axios');

app.get('/api/definition', async (req, res) => {
  const word = req.query.word;  // Accessing the word from the query parameters
  if (!word) {
      return res.status(400).send("No word provided");
  }

  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

  try {
      const response = await axios.get(url);
      const definition = response.data[0].meanings[0].definitions[0].definition;
      res.send(definition); // Sending response as a plain string
  } catch (error) {
      // Handle the case where the word might not be found or other errors
      if (error.response) {
          // Request made and server responded with a status code that falls out of the range of 2xx
          res.status(error.response.status).send(error.response.data.message || "Error retrieving definition");
      } else if (error.request) {
          // The request was made but no response was received
          res.status(500).send("No response from dictionary API");
      } else {
          // Something happened in setting up the request that triggered an Error
          res.status(500).send("Error making request to dictionary API");
      }
  }
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

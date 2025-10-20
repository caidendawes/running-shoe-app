// server.js
require('dotenv').config();  // load .env locally

const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("ERROR: MONGODB_URI is undefined!");
  process.exit(1);
}

const client = new MongoClient(uri);

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    // Example route to test
    app.get("/", (req, res) => {
      res.send("Server is running and connected to MongoDB!");
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startServer();

// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
require("dotenv").config(); // Loads .env locally if testing

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // if your HTML/CSS are in "public"

// MongoDB connection
const uri = process.env.MONGODB_URI;

let db;
let shoesCollection;

async function connectDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db("running_shoes"); // database name
    shoesCollection = db.collection("shoes"); // collection name
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

connectDB();

// ------------------- Routes -------------------

// Home route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Add shoe (from your "Find Shoes" form)
app.post("/add-shoe", async (req, res) => {
  try {
    const newShoe = req.body; // expects support, cushion, brand, price, color
    const result = await shoesCollection.insertOne(newShoe);
    res.status(201).json({ message: "Shoe added!", id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add shoe" });
  }
});

// View all shoes
app.get("/shoes", async (req, res) => {
  try {
    const shoes = await shoesCollection.find({}).toArray();
    res.json(shoes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get shoes" });
  }
});

// Optional: delete all shoes (for testing)
app.delete("/shoes", async (req, res) => {
  try {
    await shoesCollection.deleteMany({});
    res.json({ message: "All shoes deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete shoes" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB setup
const client = new MongoClient(process.env.MONGODB_URI);

let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("shoepicker"); // database name
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectDB();

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Track recent searches
let recentSearches = [];

// Routes

// Home
app.get("/", (req, res) => {
  res.render("index");
});

// Preferences page
app.get("/preferences", (req, res) => {
  res.render("preferences");
});

// About page
app.get("/about", (req, res) => {
  res.render("about");
});

// Recent searches
app.get("/recent", (req, res) => {
  res.render("recent", { recent: recentSearches });
});

// Create shoe form submission
app.post("/create", async (req, res) => {
  try {
    const { shoeName, brand, category, cushion, price, description, image } = req.body;
    const newShoe = {
      name: shoeName,
      brand,
      category,
      cushion,
      price: parseFloat(price),
      description,
      image
    };

    const shoesCollection = db.collection("shoes");
    await shoesCollection.insertOne(newShoe);

    res.send("Shoe added successfully! <a href='/preferences'>Back to Preferences</a>");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding shoe.");
  }
});

// Filter shoes
app.get("/filter", async (req, res) => {
  try {
    const { support, cushion, brand, price } = req.query;

    // Save recent search
    recentSearches.unshift({ support, cushion, brand, price, date: new Date() });
    if (recentSearches.length > 10) recentSearches.pop();

    const shoesCollection = db.collection("shoes");
    let query = {};

    if (support && support !== "any") query.category = support;
    if (cushion && cushion !== "any") query.cushion = cushion;
    if (brand && brand !== "any") query.brand = brand;
    if (price && price !== "any") {
      if (price === "budget") query.price = { $lt: 100 };
      if (price === "mid") query.price = { $gte: 100, $lte: 150 };
      if (price === "premium") query.price = { $gt: 150 };
    }

    const shoes = await shoesCollection.find(query).toArray();
    res.render("filtered", { shoes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error filtering shoes.");
  }
});

// Shoe detail page
app.get("/shoe/:id", async (req, res) => {
  try {
    const shoesCollection = db.collection("shoes");
    const shoe = await shoesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!shoe) return res.status(404).send("Shoe not found");
    res.render("shoe_detail", { shoe });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving shoe.");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

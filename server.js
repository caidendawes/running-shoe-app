const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, images)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// MongoDB setup
const client = new MongoClient(process.env.MONGODB_URI);
let shoesCollection;

async function startDB() {
  try {
    await client.connect();
    const db = client.db("running-shoe-app");
    shoesCollection = db.collection("shoes");
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

startDB();

// Track recent searches
let recentSearches = [];

// Routes

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Preferences page with dynamic filter options
app.get("/preferences", async (req, res) => {
  try {
    const brands = await shoesCollection.distinct("brand");
    const categories = await shoesCollection.distinct("category");
    const cushions = await shoesCollection.distinct("cushion");

    res.render("preferences", { brands, categories, cushions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading preferences");
  }
});

// About page (still static)
app.get("/about", (req, res) => {
  res.render("about");
});

// Recent searches page
app.get("/recent", (req, res) => {
  res.render("recent", { recent: recentSearches });
});

// Filter shoes
app.get("/filter", async (req, res) => {
  const { support, cushion, brand, price } = req.query;

  // Save recent search
  recentSearches.unshift({ support, cushion, brand, price, date: new Date() });
  if (recentSearches.length > 10) recentSearches.pop();

  let query = {};

  if (support && support !== "any") query.category = support;
  if (cushion && cushion !== "any") query.cushion = cushion;
  if (brand && brand !== "any") query.brand = brand;

  // Price filter
  if (price && price !== "any") {
    if (price === "budget") query.price = { $lt: 100 };
    else if (price === "mid") query.price = { $gte: 100, $lte: 150 };
    else if (price === "premium") query.price = { $gt: 150 };
  }

  try {
    const shoes = await shoesCollection.find(query).toArray();
    res.render("filtered", { shoes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error filtering shoes");
  }
});

// Shoe detail page
app.get("/shoe/:id", async (req, res) => {
  try {
    const shoe = await shoesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!shoe) return res.status(404).send("Shoe not found");
    res.render("shoe_detail", { shoe });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading shoe details");
  }
});

// Create shoe page
app.get("/create", (req, res) => {
  res.render("create");
});

// Handle creating a new shoe
app.post("/create", async (req, res) => {
  const { shoeName, description, imageUrl, brand, category, cushion, price } = req.body;
  try {
    await shoesCollection.insertOne({
      name: shoeName,
      description,
      image: imageUrl,
      brand,
      category,
      cushion,
      price: Number(price),
    });
    res.redirect("/preferences");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding new shoe");
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

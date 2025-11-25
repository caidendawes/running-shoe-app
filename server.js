const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb"); // MongoDB client
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// ===== MongoDB Setup =====
const uri = process.env.MONGODB_URI; // from .env
const client = new MongoClient(uri);
let shoesCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("shoePickerDB"); // database name
    shoesCollection = db.collection("shoes"); // collection name
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}
connectDB();

// ===== Routes =====

// Home
app.get("/", (req, res) => {
  res.render("index"); // index.ejs
});

// Preferences
app.get("/preferences", (req, res) => {
  res.render("preferences"); // preferences.ejs
});

// About
app.get("/about", (req, res) => {
  res.render("about"); // about.ejs
});

// Create page
app.get("/create", (req, res) => {
  res.render("create"); // create.ejs
});

// Recent searches page
let recentSearches = [];
app.get("/recent", (req, res) => {
  res.render("recent", { recent: recentSearches });
});

// Filter shoes
app.get("/filter", async (req, res) => {
  const { support, cushion, brand, price } = req.query;

  // Save recent search
  recentSearches.unshift({ support, cushion, brand, price, date: new Date() });
  if (recentSearches.length > 10) recentSearches.pop();

  try {
    const shoes = await shoesCollection.find().toArray();

    let filtered = shoes.filter(shoe => {
      if (support && support !== "any" && shoe.category !== support) return false;
      if (cushion && cushion !== "any" && shoe.cushion !== cushion) return false;
      if (brand && brand !== "any" && shoe.brand !== brand) return false;

      if (price) {
        if (price === "budget" && shoe.price >= 100) return false;
        if (price === "mid" && (shoe.price < 100 || shoe.price > 150)) return false;
        if (price === "premium" && shoe.price <= 150) return false;
      }

      return true;
    });

    res.render("filtered", { shoes: filtered });
  } catch (err) {
    console.error("Error fetching shoes:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Shoe detail page
app.get("/shoe/:id", async (req, res) => {
  try {
    const shoe = await shoesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!shoe) return res.status(404).send("Shoe not found");
    res.render("shoe_detail", { shoe });
  } catch (err) {
    console.error("Error fetching shoe:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Create shoe (all fields)
app.post("/create", async (req, res) => {
  const { shoeName, brand, category, cushion, price, description, imageUrl } = req.body;

  const newShoe = {
    name: shoeName,
    brand,
    category,
    cushion,
    price: Number(price),
    description,
    image: imageUrl
  };

  try {
    await shoesCollection.insertOne(newShoe);
    res.redirect("/preferences"); // go to filter page after adding
  } catch (err) {
    console.error("Error adding new shoe:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ===== Start server =====
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

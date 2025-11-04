const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// MongoDB setup
let db, shoesCollection;
MongoClient.connect(process.env.MONGODB_URI)
  .then(client => {
    db = client.db("shoe-picker"); // database name
    shoesCollection = db.collection("shoes"); // collection name
    console.log("Connected to MongoDB Atlas");
  })
  .catch(err => console.error(err));

// Track recent searches (in memory)
let recentSearches = [];

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/preferences", (req, res) => res.render("preferences"));
app.get("/about", (req, res) => res.render("about"));
app.get("/recent", (req, res) => res.render("recent", { recent: recentSearches }));

// CREATE - add new shoe
app.post("/create", async (req, res) => {
  try {
    const { shoeName, brand, category, cushion, price, description, imageUrl } = req.body;

    const newShoe = {
      name: shoeName,
      brand: brand || "Unknown",
      category: category || "Neutral",
      cushion: cushion || "Medium",
      price: parseInt(price) || 120,
      image: imageUrl || "default.jpg",
      description: description || ""
    };

    const result = await shoesCollection.insertOne(newShoe);
    console.log("Inserted shoe with _id:", result.insertedId);

    res.send(`Shoe added successfully! <a href="/">Go Home</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding shoe to database");
  }
});

// FILTER shoes
app.get("/filter", async (req, res) => {
  try {
    const { support, cushion, brand, price } = req.query;

    // Save recent search
    recentSearches.unshift({ support, cushion, brand, price, date: new Date() });
    if (recentSearches.length > 10) recentSearches.pop();

    // Build query for MongoDB
    let query = {};
    if (support && support !== "any") query.category = support;
    if (cushion && cushion !== "any") query.cushion = cushion;
    if (brand && brand !== "any") query.brand = brand;

    let shoes = await shoesCollection.find(query).toArray();

    if (price) {
      shoes = shoes.filter(shoe => {
        if (price === "budget" && shoe.price >= 100) return false;
        if (price === "mid" && (shoe.price < 100 || shoe.price > 150)) return false;
        if (price === "premium" && shoe.price <= 150) return false;
        return true;
      });
    }

    res.render("filtered", { shoes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving shoes");
  }
});

// VIEW shoe details
app.get("/shoe/:id", async (req, res) => {
  try {
    const shoe = await shoesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!shoe) return res.status(404).send("Shoe not found");
    res.render("shoe_detail", { shoe });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving shoe");
  }
});

// UPDATE shoe
app.post("/update/:id", async (req, res) => {
  try {
    const { shoeName, brand, category, cushion, price, description, imageUrl } = req.body;
    await shoesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
          name: shoeName,
          brand: brand,
          category: category,
          cushion: cushion,
          price: parseInt(price),
          description: description,
          image: imageUrl
        }
      }
    );
    res.send(`Shoe updated! <a href="/shoe/${req.params.id}">View Shoe</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating shoe");
  }
});

// DELETE shoe
app.post("/delete/:id", async (req, res) => {
  try {
    await shoesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(`Shoe deleted! <a href="/filter">Back to Shoes</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting shoe");
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

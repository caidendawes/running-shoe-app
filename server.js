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

// Hardcoded shoes array
let shoes = [
  { _id: 1, name: "Brooks Adrenaline GTS 24", brand: "Brooks", category: "Support", cushion: "High", price: 160, image: "brooks_adrenaline.jpg" },
  { _id: 2, name: "Asics Kayano", brand: "ASICS", category: "Support", cushion: "High", price: 160, image: "asics_kayano.jpg" },
  { _id: 3, name: "Hoka Gaviota", brand: "Hoka", category: "Support", cushion: "High", price: 180, image: "hoka_gaviota.jpg" },
  { _id: 4, name: "Brooks Ghost", brand: "Brooks", category: "Neutral", cushion: "Medium", price: 120, image: "brooks_ghost.jpg" },
  { _id: 5, name: "Brooks Trace", brand: "Brooks", category: "Neutral", cushion: "Medium", price: 100, image: "brooks_trace.jpg" },
  { _id: 6, name: "Hoka Solimar", brand: "Hoka", category: "Neutral", cushion: "Medium", price: 100, image: "hoka_solimar.jpg" },
  { _id: 7, name: "Saucony Guide", brand: "Saucony", category: "Support", cushion: "Medium", price: 140, image: "saucony_guide.jpg" },
  { _id: 8, name: "Saucony Ride", brand: "Saucony", category: "Neutral", cushion: "Medium", price: 130, image: "saucony_ride.jpg" },
  { _id: 9, name: "Nike Zoom Fly", brand: "Nike", category: "Workout/Race", cushion: "Low", price: 200, image: "nike_zoomfly.jpg" },
  { _id: 10, name: "Nike Vaporfly", brand: "Nike", category: "Workout/Race", cushion: "Low", price: 250, image: "nike_vaporfly.jpg" },
  { _id: 11, name: "Brooks Hyperion", brand: "Brooks", category: "Workout/Race", cushion: "Low", price: 200, image: "brooks_hyperion.jpg" },
  { _id: 12, name: "Adidas Adios Pro", brand: "Adidas", category: "Workout/Race", cushion: "Low", price: 220, image: "adidas_adiospro.jpg" },
  { _id: 13, name: "Saucony Endorphin Pro", brand: "Saucony", category: "Workout/Race", cushion: "Low", price: 220, image: "saucony_endorphinpro.jpg" },
];

// Track recent searches
let recentSearches = [];

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/preferences", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "preferences.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

// Recent searches page
app.get("/recent", (req, res) => {
  res.render("recent", { recent: recentSearches });
});

// Filter shoes
app.get("/filter", (req, res) => {
  const { support, cushion, brand, price } = req.query;

  // Save recent search
  recentSearches.unshift({ support, cushion, brand, price, date: new Date() });
  if (recentSearches.length > 10) recentSearches.pop();

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
});

// Shoe detail page
app.get("/shoe/:id", (req, res) => {
  const shoe = shoes.find(s => s._id == req.params.id);
  if (!shoe) return res.status(404).send("Shoe not found");
  res.render("shoe_detail", { shoe });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

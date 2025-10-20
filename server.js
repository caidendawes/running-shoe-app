// server.js
require('dotenv').config();
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    useNewUrlParser: true,     // ensures the connection string is parsed correctly
    useUnifiedTopology: true,  // enables the modern connection engine
    tls: true                   // forces TLS/SSL encryption
});

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("shoePickerDB"); // database name
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
}
connectDB();

// Serve home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Handle "Find Shoes" form submission
app.post("/add-shoe", async (req, res) => {
    const { support, cushion, brand, price } = req.body;
    if (!support || !cushion || !brand || !price) {
        return res.status(400).send("Missing fields");
    }
    try {
        await db.collection("shoes").insertOne({
            support,
            cushion,
            brand,
            price,
            date: new Date()
        });
        res.redirect("/retrieve.html"); // show past entries after submission
    } catch (err) {
        res.status(500).send("Database error");
    }
});

// API endpoint to get all shoe entries
app.get("/api/shoes", async (req, res) => {
    try {
        const shoes = await db.collection("shoes").find().toArray();
        res.json(shoes);
    } catch (err) {
        res.status(500).send("Database error");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

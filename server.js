// server.js
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const { MongoClient } = require('mongodb');

// Serve static files (HTML, CSS, images)
app.use(express.static(path.join(__dirname)));

// Parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("running-shoe-app");
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
}

connectDB();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/create.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'create.html'));
});

// Example: View all shoes
app.get('/retrieve.html', async (req, res) => {
    try {
        const shoes = await db.collection('shoes').find({}).toArray();
        res.json(shoes); // We'll handle front-end rendering later
    } catch (err) {
        res.status(500).send("Error retrieving shoes");
    }
});

// Example: Add a shoe
app.post('/create.html', async (req, res) => {
    const { support, cushion, brand, price } = req.body;
    try {
        await db.collection('shoes').insertOne({ support, cushion, brand, price });
        res.redirect('/retrieve.html'); // After adding, go to view shoes
    } catch (err) {
        res.status(500).send("Error adding shoe");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Import required packages
const express = require('express');
const cors = require('cors');

// Create the Express application
const app = express();

// --- MIDDLEWARE CONFIGURATION ---

// 1. Enable CORS to allow the frontend to call the API
app.use(cors());

// 2. Enable JSON parsing (for POST/PUT requests)
app.use(express.json());

// --- DATABASE CONFIGURATION ---

// (This is the part that connects to the Render DB)
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL, // Reads the variable from Render
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL database!'))
  .catch(err => console.error('Database connection error', err.stack));


// --- TEST ROUTE ---

// A "health check" route to see if the server is alive
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is working!' });
});

// Add your other routes here (e.g., /api/users, /api/products)
// ...

// --- SERVER STARTUP ---

// Use the port provided by Render (or 3001 locally)
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
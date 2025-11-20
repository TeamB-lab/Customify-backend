// authRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // We will use this later for Login

// MODIFICA PRINCIPALE:
// Non importiamo più { Pool } from 'pg' qui.
// Non creiamo più una connessione locale.

// Esportiamo una funzione che ACCETTA il client del database (dbClient) come argomento.
module.exports = (dbClient) => {
  const router = express.Router();

  // ==========================================
  // Authentication Endpoints
  // ==========================================

  // --- Registration Endpoint (POST /api/auth/register) ---
  router.post('/register', async (req, res) => {
    try {
      // 1. Receive data from the request body
      const { name, email, password } = req.body;

      // 2. Basic validation
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please fill in all required fields (name, email, password).' });
      }

      // 3. Check if the email already exists
      // USA dbClient.query INVECE DI pool.query
      const userExists = await dbClient.query('SELECT * FROM users WHERE email = $1', [email]);

      if (userExists.rows.length > 0) {
        return res.status(409).json({ message: 'This email is already registered.' });
      }

      // 4. Password Hashing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 5. Insert the new user
      // USA dbClient.query INVECE DI pool.query
      const newUser = await dbClient.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
        [name, email, hashedPassword]
      );

      // 6. Respond to frontend
      res.status(201).json({
        message: 'Registration successful!',
        user: newUser.rows[0]
      });

    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  });

  // --- Login Endpoint (POST /api/auth/login) ---
  router.post('/login', async (req, res) => {
    try {
      // 1. Receive email and password from the request body
      const { email, password } = req.body;

      // 2. Basic validation: Check if both fields are provided
      if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password.' });
      }

      // 3. Find the user in the database using the email
      // Query the DB for the user matching the provided email
      const result = await dbClient.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      // 4. Check if the user exists
      if (!user) {
        // SECURITY NOTE: Never specifically say "Email not found".
        // Always use a generic message to prevent attackers from enumerating valid emails.
        return res.status(401).json({ message: 'Invalid credentials.' }); // 401 Unauthorized
      }

      // 5. Verify the password
      // bcrypt compares the provided plaintext password with the hashed password stored in the DB
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        // Again, use a generic message for security reasons
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      // === IF WE REACHED HERE, LOGIN IS SUCCESSFUL! ===

      // 6. Generate the JWT Token (The "digital wristband")
      // - payload: data embedded inside the token (e.g., user ID and email)
      // - secret: the secret key from .env used to sign the token
      // - options: 'expiresIn' defines how long the token is valid (e.g., 1 hour)
      const token = jwt.sign(
        { userId: user.id, email: user.email }, // Payload
        process.env.JWT_SECRET,                 // Secret Key
        { expiresIn: '1h' }                     // Expiration time
      );

      // 7. Respond to the frontend with success and send the token
      res.status(200).json({
        message: 'Login successful!',
        token: token, // This is the important "pass" for the frontend
        user: { // Sending back basic user info is often useful for the frontend app state
            id: user.id,
            name: user.name,
            email: user.email
        }
      });

    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Server error during login.' });
    }
  });

  // Ritorniamo il router configurato alla fine della funzione
  return router;
};
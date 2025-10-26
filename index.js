const express = require('express');
const { Client } = require('pg');
const app = express();
// Use the PORT set by Render (10000) or a default for local testing
const port = process.env.PORT || 10000; 

// --- Database Configuration and Connection ---

// The connectionString is automatically loaded from the DATABASE_URL environment variable on Render
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // SSL is necessary to connect to the external Render database
    ssl: {
        rejectUnauthorized: false
    }
});

// Connect to the database
client.connect()
    .then(() => console.log('✅ Connected to PostgreSQL database.'))
    .catch(err => console.error('❌ Database connection error. Check DATABASE_URL and Render status.', err));


// --- Database Initialization (Create Table and Insert 'Team B') ---

async function initializeDatabase() {
    try {
        // Create the table if it does not already exist
        await client.query(
            `CREATE TABLE IF NOT EXISTS team_data (
                id SERIAL PRIMARY KEY,
                message VARCHAR(255) NOT NULL
            );`
        );

        // Check if the required 'Team B' row already exists
        const check = await client.query("SELECT * FROM team_data WHERE message = 'Team B'");

        // Insert the row only if it doesn't exist
        if (check.rows.length === 0) {
            await client.query("INSERT INTO team_data (message) VALUES ('Team B')");
            console.log("📝 Successfully inserted 'Team B' data.");
        }
    } catch (err) {
        console.error('❌ Error initializing database:', err);
    }
}
// Run the initialization logic when the server starts
initializeDatabase();


// --- Express Route to Display Data (Website Requirement) ---

app.get('/', async (req, res) => {
    try {
        // Retrieve the data from the table
        const result = await client.query("SELECT message FROM team_data LIMIT 1");

        if (result.rows.length > 0) {
            const message = result.rows[0].message;
            // Display the data as required by the task 
            res.send(`
                <!DOCTYPE html>
                <html>
                <head><title>Customify Backend Status</title></head>
                <body>
                    <h1>Customify Backend Status: RUNNING</h1>
                    <p>Data retrieved from PostgreSQL: <strong>${message}</strong></p>
                    <p>This page confirms the database connection and data retrieval task is complete.</p>
                </body>
                </html>
            `);
        } else {
            res.status(404).send('No data found in the team_data table.');
        }
    } catch (err) {
        console.error('❌ Error fetching data:', err);
        res.status(500).send('Internal Server Error while fetching data.');
    }
});


// --- Start Server ---

app.listen(port, () => {
    console.log(`🚀 Backend server listening on port ${port}`);
});
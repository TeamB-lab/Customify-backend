const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const app = express();
// Use the PORT set by Render (10000) or a default for local testing
const port = process.env.PORT || 10000; 
app.use(cors());

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


// --- API ENDPOINTS ---

/**
 * [GET] /api/products
 * Endpoint to retrieve all products from the 'products' table
 */
app.get('/api/products', async (req, res) => {
    try {
        // 1. Esegui la query al database
        const result = await client.query("SELECT * FROM products");

        // 2. Rispondi con i dati in formato JSON
        res.status(200).json(result.rows);

    } catch (err) {
        console.error('❌ Error fetching products:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * [GET] /api/products/:id
 * Endpoint to retrieve a single product by its ID
 */
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = {
            text: 'SELECT * FROM products WHERE id = $1',
            values: [id],
        };

        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('❌ Error fetching single product:', err);

        if (err.code === '22P02') {
             return res.status(400).json({ error: 'Invalid product ID format' });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


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
        //const check = await client.query("SELECT * FROM team_data WHERE message = 'Team B'");

        // Insert the row only if it doesn't exist
        /*if (check.rows.length === 0) {
            await client.query("INSERT INTO team_data (message) VALUES ('Team B')");
            console.log("📝 Successfully inserted 'Team B' data.");
        }*/
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
        const result = await client.query("SELECT * FROM team_data WHERE id = 1");

        if (result.rows.length > 0) {
            const message = result.rows[0].message;
            // Display the data as required by the task 
            res.send(`
                <!DOCTYPE html>
                <html>
                <head><title>Customify Backend Status</title></head>
                <body>
                    <h1 style="color:red;">Customify Backend Status: RUNNING</h1>
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
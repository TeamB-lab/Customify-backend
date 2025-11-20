const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const app = express();
app.use(express.json());

// Use the PORT set by Render (10000) or a default for local testing
const port = process.env.PORT || 10000; 
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'https://customify-backend.onrender.com',
    'https://customify-frontend.onrender.com'
  ],
  credentials: true
}));

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
 * Endpoint to retrieve all products, optionally filtered by category
 * Usage: /api/products?category=hoodies
 */
app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query; 
        
        let queryText = "SELECT * FROM products";
        let queryParams = [];

        if (category) {
            queryText += " WHERE category = $1";
            queryParams.push(category);
        }

        const result = await client.query(queryText, queryParams);
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

/**
 * [POST] /api/orders
 * Endpoint to create a new order from cart data
 */
app.post('/api/orders', async (req, res) => {
    try {
        const { user_id, items, total_amount } = req.body;

        // Basic Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // 1. Insert Order Header
        const orderQuery = `
            INSERT INTO orders (user_id, total_amount, status)
            VALUES ($1, $2, 'confirmed')
            RETURNING id
        `;
        // Note: user_id || null ensures we don't crash if user_id is missing
        const orderResult = await client.query(orderQuery, [user_id || null, total_amount]);
        const newOrderId = orderResult.rows[0].id;

        // 2. Insert Order Items
        for (const item of items) {
            const itemQuery = `
                INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                VALUES ($1, $2, $3, $4)
            `;
            // We assume the frontend sends items with { product_id, quantity, price }
            await client.query(itemQuery, [newOrderId, item.product_id, item.quantity, item.price]);
        }

        // 3. Respond with Success
        console.log(`✅ Order #${newOrderId} created successfully.`);
        res.status(201).json({ 
            message: 'Order created successfully', 
            orderId: newOrderId 
        });

    } catch (err) {
        console.error('❌ Error creating order:', err);
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

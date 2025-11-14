# Backend Service (Node.js + Express API) Documentation 
 
This document outlines the purpose and API endpoints of the Customify application's backend service. 
 
## Programmer Capabilities 
 
As the development team, programmers have full control over: 
* Developing and managing **backend logic** (API endpoints, business rules). 
* Implementing and managing the **database connection** and all data transactions with PostgreSQL. 
* System configuration and continuous deployment (CD) via GitHub Actions and Render. 
 
## User Capabilities 
 
Direct user access to this backend service is not intended. The user's interaction is mediated entirely through the frontend application. 
The most a user can do is **refresh the page to view data** that has been successfully retrieved by this backend from the database and formatted for display. 

---

## API Endpoint Documentation
 
### Products

#### GET /api/products
* **Description:** Retrieves a list of all available products.
* **Payload:** None.
* **Success Response (200 OK):**
    ```json
    [
        { "id": 1, "name": "T-Shirt", "price": "19.99", ... },
        { "id": 2, "name": "Hoodie", "price": "39.99", ... }
    ]
    ```

#### GET /api/products/:id
* **Description:** Retrieves details for a single product by its unique ID.
* **Payload:** None. The `id` is passed as a URL parameter.
* **Success Response (200 OK):**
    ```json
    { "id": 1, "name": "T-Shirt", "price": "19.99", ... }
    ```
* **Error Response (404 Not Found):**
    ```json
    { "error": "Product not found" }
    ```
* **Error Response (400 Bad Request):**
    ```json
    { "error": "Invalid product ID format" }
    ```

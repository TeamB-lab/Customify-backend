// authenticateToken.js

const jwt = require('jsonwebtoken');

// This function is the middleware. It runs BEFORE the final route handler.
// 'next' is a special function to call when we want to let the request pass.
const authenticateToken = (req, res, next) => {
  // 1. Get the token from the request header
  // The standard format is "Authorization: Bearer <TOKEN_STRING>"
  const authHeader = req.headers['authorization'];

  // 2. Check if the header exists and extract the token part
  // If authHeader is undefined, token will be undefined.
  // If it exists, we split by ' ' (space) and take the second part (index 1).
  const token = authHeader && authHeader.split(' ')[1];

  // 3. If there is no token, deny access immediately
  if (token == null) {
    console.warn('Authentication failed: No token provided.');
    // 401 Unauthorized: You didn't provide credentials
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // 4. Verify the token
  // jwt.verify checks if the token is valid, not expired, and signed with our secret key.
  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    if (err) {
      // If verification fails (e.g., expired, fake token)
      console.error('Authentication failed: Invalid token.', err.message);
      // 403 Forbidden: Your credentials are invalid or expired
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    // 5. SUCCESS! The token is valid.
    // We attach the information hidden inside the token (userId, email) to the 'req' object.
    // This way, the next function (e.g., the order creation handler) knows WHO the user is.
    req.user = userPayload;

    // 6. Let the request pass to the next handler
    next();
  });
};

module.exports = authenticateToken;
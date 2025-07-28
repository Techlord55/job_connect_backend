const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Adjust the path based on your project structure

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];  // Extract token from Bearer <token>

      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (assuming you're storing user ID in the token)
      req.user = await User.findById(decoded.id);
      next();  // Move to the next middleware or route handler
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } else {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};

module.exports = protect;  // Export the protect middleware

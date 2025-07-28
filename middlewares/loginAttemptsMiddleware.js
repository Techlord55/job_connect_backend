const User = require('../models/User');

exports.loginLimiter = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user && user.loginAttempts >= 5) {
    return res.status(429).json({ message: 'Too many login attempts. Try again later.' });
  }

  next();
};

const User = require('../models/User'); // Your User mongoose model or ORM model
const jwt = require('jsonwebtoken');    // Or your preferred JWT library

/**
 * Register or login a user from social login data
 * @param {Object} socialData - { email, fullName, avatar }
 * @returns {Object} { user, accessToken, refreshToken }
 */
async function registerFromSocial({ email, fullName, avatar }) {
  try {
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        email,
        fullName,
        avatar,
        isEmailVerified: true, // Typically social emails are verified by provider
        // add other default fields if needed
      });

      await user.save();
    }

    // Generate JWT tokens (adjust payload and secret accordingly)
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { user, accessToken, refreshToken };
  } catch (error) {
    console.error('Error in registerFromSocial:', error);
    throw new Error('Failed to register/login from social login');
  }
}

module.exports = { registerFromSocial };


const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const generateCode = require('../utils/generateCode');
const { validationResult } = require('express-validator');
const { registerValidator } = require('../validators/authValidator');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');


const REQUIRE_BOTH_VERIFICATIONS = process.env.REQUIRE_BOTH_VERIFICATIONS === 'true';






const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: 'Refresh token required' });

  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== token) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }

  const newAccessToken = generateAccessToken(user);
  res.json({ accessToken: newAccessToken });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.emailVerificationCode !== code)
    return res.status(400).json({ message: 'Invalid code' });

  user.isEmailVerified = true;
  user.emailVerificationCode = null;
  await user.save();

  res.json({ message: 'Email verified' });
});

const verifyPhone = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;
  const user = await User.findOne({ phone });

  if (!user || user.phoneVerificationCode !== code)
    return res.status(400).json({ message: 'Invalid code' });

  user.isPhoneVerified = true;
  user.phoneVerificationCode = null;
  await user.save();

  res.json({ message: 'Phone number verified' });
});

const resendEmailCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return regex.test(email);
  };
  
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  
  

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const code = generateCode();
  const to  = user.email;
  user.emailVerificationCode = code;

  await user.save();
  console.log('Sending email to:', to);
  await sendEmail(user.email, 'Your new email verification code', `Code: ${code}`);
  res.json({ message: 'Email code resent' });
});

// const resendPhoneCode = asyncHandler(async (req, res) => {
//   const { phone } = req.body;

//   const user = await User.findOne({ phone });
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   const code = generateCode();
//   user.phoneVerificationCode = code;
//   await user.save();

//   await sendSMS(phone, `Your new phone verification code is: ${code}`);
//   res.json({ message: 'SMS code resent' });
// });


const registerUser = [
  registerValidator,

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, password, email, role } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    const userExists = await User.findOne({ $or: [{ email: lowerCaseEmail }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email or phone already in use' });
    }

    const emailCode = generateCode();
    const phoneCode = generateCode();

    try {
      // Create new user first (before generating tokens)
      const user = new User({
        fullName,
        email: lowerCaseEmail,
        phone,
        password,
         role: role || null,
        emailVerificationCode: emailCode,
        phoneVerificationCode: phoneCode,
      });

      // Send verification email and SMS
      await sendEmail(lowerCaseEmail, 'Verify your email', `Your email verification code is: ${emailCode}`);
      // await sendSMS(phone, `Your phone verification code is: ${phoneCode}`);

      

      // Generate access and refresh tokens after saving
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const hashedRefresh = await bcrypt.hash(refreshToken, 10);
      user.refreshToken = hashedRefresh;
      await user.save(); // Save refreshToken

      console.log(`✅ New user registered: ${user.email}, Phone: ${user.phone}`);

      res.status(201).json({
        message: 'User registered successfully. Verification codes sent.',
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role, // 👈 Add this
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          emailVerificationCode: user.emailVerificationCode,
          phoneVerificationCode: user.phoneVerificationCode,
        },
      });
    } catch (error) {
      console.error('Registration failed:', error);
      res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
  }),
];



// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const {  phone, password } = req.body;

  const email = req.body.email.toLowerCase();


  const user = await User.findOne({
    $or: [{ email }, { phone }]
  });
  
  

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (REQUIRE_BOTH_VERIFICATIONS) {
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      console.log('Please verify your email and phone first')

      return res.status(403).json({ message: 'Please verify your email and phone first' });
    

    }
   
  } else {
    if (!user.isEmailVerified) {
      console.log('Please verify your email and phone first')

      return res.status(403).json({ message: 'Please verify your email first' });
    }
  }
  

  if (user.loginAttempts > 5) {
    return res.status(403).json({ message: 'Too many failed attempts. Try later.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Plain password:', password);
console.log('Hashed in DB:', user.password);

console.log('Password match:', isMatch);

  if (!isMatch) {
    user.loginAttempts += 1;
    await user.save();
    return res.status(401).json({ message: 'Invalid credentials' });
  }


  user.loginAttempts = 0;
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Optionally, store the refresh token in the database (optional for better security)
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  user.refreshToken = hashedRefresh;
  
  await user.save();

  res.status(200).json({
   token: accessToken,  // Return the access token
    refreshToken, // Return the refresh token
    
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});


// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({ refreshToken: token });
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
  res.json({ message: 'Logged out' });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const resetToken = generateCode();
  user.resetPasswordToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  await sendEmail(email, 'Reset your password', `Your reset code is: ${resetToken}`);

  res.status(200).json({ message: 'Reset code sent to your email' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  const user = await User.findOne({
    email,
    resetPasswordToken: resetCode,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset code');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.status(200).json({ message: 'Password reset successful' });
});

// authController.js

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {``
  // Additional safety check (though protect middleware should handle this)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized'
    });
  }

  const user = await User.findById(req.user._id)
    .select('-password -refreshToken -emailVerificationCode -phoneVerificationCode')
    .lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});


// @desc    Update user role
// @route   PUT /api/auth/update-role
// @access  Private

const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const userId = req.user._id; // From auth middleware

  // Validate role (adjust these based on your frontend role values)
  const validRoles = ['jobseeker', 'employer', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      success: false,
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

      // Add validation for req.user
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while updating role' 
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  resendEmailCode,
  // resendPhoneCode,
  refreshToken,
  verifyEmail,
  verifyPhone,
  generateAccessToken,
  generateRefreshToken,
  generateCode,
 getMe,
 updateRole, // Add this
};

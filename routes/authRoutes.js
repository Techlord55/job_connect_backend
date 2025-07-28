// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { resendEmailCode, resendPhoneCode } = require('../controllers/authController');
const protect = require('../middlewares/authMiddleware');


const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests
  message: 'Too many attempts. Please try again later.'
});

router.post('/register', authLimiter, authController.registerUser);
router.post('/login', authLimiter, authController.loginUser);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logoutUser);
router.post('/resend-email-code', resendEmailCode);
// router.post('/resend-phone-code', resendPhoneCode);
router.post('/verify-phone', authController.verifyPhone);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/update-role', protect, authController.updateRole);

router.get('/me' , protect , authController.getMe);

module.exports = router;

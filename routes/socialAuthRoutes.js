const express = require('express');
const router = express.Router();
const {
  connect,
  socialCallback,
  signOut,
  logtoMiddleware,
} = require('../controllers/socialAuthController');

// Routes
router.get('/connect/:provider', connect);
router.get('/social-callback', logtoMiddleware, socialCallback);
router.get('/signout', signOut);

module.exports = router;

// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markMessagesRead,
  getUnreadCounts
} = require('../controllers/messageController');
const requireAuth = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.post('/:chatId', sendMessage);               // Send message
router.get('/:chatId', getMessages);                // Get messages
router.post('/:chatId/mark-read', markMessagesRead); // Mark read
router.get('/unread-counts/:userId', getUnreadCounts); // Unread counts

module.exports = router;

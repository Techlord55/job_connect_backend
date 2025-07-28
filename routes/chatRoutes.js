const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const authMiddleware = require('../middlewares/authMiddleware');

// Create or get a chat for an item between two users
router.post('/start-chat', authMiddleware, async (req, res) => {
  const { itemId,  sellerId } = req.body;
  const buyerId = req.user.id; // From authenticated user

  
  // Validate: Cannot chat with yourself
  if (buyerId === sellerId) {
    return res.status(400).json({ 
      error: "You cannot start a chat with yourself" 
    });
  }


  try {
    // Check if chat already exists
    let chat = await Chat.findOne({
      item: itemId,
      participants: { $all: [buyerId, sellerId] }
    });

    if (!chat) {
      chat = new Chat({
        item: itemId,
        participants: [buyerId, sellerId],
        messages: []
      });

      await chat.save();
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




// Get all chats for authenticated user with last message
const mongoose = require('mongoose'); // ensure this is imported at the top

// Get all chats for authenticated user with last message
router.get('/user-chats', authMiddleware, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id); // ✅ convert string to ObjectId

    const chats = await Chat.aggregate([
      { $match: { participants: userObjectId } }, // 🔥 FIXED HERE
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$chatId', '$$chatId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessage'
        }
      },
      {
        $lookup: {
          from: 'items',
          localField: 'item',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      {
        $project: {
          _id: 1,
          'item._id': 1,
          'item.name': 1,
          'item.price': 1,
          'item.image': 1,
          participants: 1,
          lastMessage: { $arrayElemAt: ['$lastMessage.text', 0] },
          unreadCount: {
            $size: {
              $filter: {
                input: '$lastMessage',
                as: 'msg',
                cond: { $not: { $in: [req.user.id, '$$msg.readBy'] } }
              }
            }
          },
          updatedAt: 1
        }
      }
    ]);

    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to load chats' });
  }
});


// Get messages for a specific chat (with pagination)
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ error: 'Invalid chat ID' });
  }

  try {
    // Verify user is a participant
    const isParticipant = await Chat.exists({
      _id: chatId,
      participants: req.user.id
    });

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized for this chat' });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json(messages.reverse()); // Return oldest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Send a message
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    // Verify user is a participant and update chat timestamp
    const chat = await Chat.findOneAndUpdate(
      {
        _id: chatId,
        participants: req.user.id
      },
      { $set: { updatedAt: new Date() } },
      { new: true }
    );

    if (!chat) {
      return res.status(403).json({ error: 'Not authorized for this chat' });
    }

    const message = new Message({
      chatId,
      sender: req.user.id,
      text: text.trim(),
      readBy: [req.user.id]
    });

    await message.save();

    // Add message reference to chat (optimized)
    await Chat.updateOne(
      { _id: chatId },
      { $push: { messages: message._id } }
    );

    res.status(201).json({
      _id: message._id,
      chatId: message.chatId,
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});


// Fetch chats for a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({ participants: userId })
      .populate('item')
      .populate('participants', 'name email') // customize fields as needed
      .populate({
        path: 'messages',
        options: { sort: { createdAt: -1 }, limit: 1 } // show last message
      });

    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message in a chat
router.post('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const { senderId, text } = req.body;

  try {
    const message = new Message({
      chatId,
      sender: senderId,
      text,
      readBy: [senderId]
    });

    await message.save();

    // Add message to chat
    const chat = await Chat.findById(chatId);
    chat.messages.push(message._id);
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;

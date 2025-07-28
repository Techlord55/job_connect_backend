

// controllers/messageController.js
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');


exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const chatId = req.params.chatId;
    const senderId = req.user.id;
  

    console.log("📤 sendMessage - Chat ID:", chatId);
    console.log("✉️ Message Text:", text);
    console.log("👤 Sender ID:", senderId);

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(senderId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const message = new Message({ chatId, senderId, text });
    await message.save();

    chat.messages.push(message._id);
    await chat.save();

    req.app.get('io').to(chatId).emit('new_message', message);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => { 
  try {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const senderId = req.user.id;
    

    console.log("📤 sendMessage - Chat ID:", chatId);
    console.log("👤 Sender ID:", senderId);

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.markMessagesRead = async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  try {
    const messages = await Message.find({ chatId });

    for (let msg of messages) {
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
        await msg.save();
      }
    }

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUnreadCounts = async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({ participants: userId }).populate('messages');

    const unreadCounts = chats.map(chat => {
      const unreadMessages = chat.messages.filter(
        msg => !msg.readBy.includes(userId) && msg.sender.toString() !== userId
      );
      return {
        chatId: chat._id,
        count: unreadMessages.length
      };
    });

    res.status(200).json(unreadCounts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

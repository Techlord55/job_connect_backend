const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  participants: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    validate: {
      validator: function(arr) {
        // Ensure no duplicates
        return new Set(arr.map(id => id.toString())).size === arr.length;
      },
      message: 'Chat cannot have duplicate participants'
    }
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);

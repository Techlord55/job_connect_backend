const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        // Updated regex for Cameroonian phone numbers
        return /^(6|2|3)\d{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid Cameroonian phone number!`
    }
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  video: {
    type: String,
    required: [false, 'Video is required']
  },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search functionality
ItemSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', ItemSchema);
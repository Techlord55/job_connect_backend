const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Item = require('../models/Item');
const protect = require('../middlewares/authMiddleware'); 
const authMiddleware = require('../middlewares/authMiddleware');


// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/market');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed (JPEG, PNG, GIF)'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// POST endpoint
router.post('/items',protect, upload.single('image'), async (req, res) => {
  console.log('Headers:', req.headers['content-type']);
  try {
    const requiredFields = ['name', 'description', 'location', 'price', 'phone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Image is required'
      });
    }

    // Get sellerId from authenticated user (make sure auth middleware is applied)
    const sellerId = req.user?.id;
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized: sellerId missing' });
    }

    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      price: Number(req.body.price),
      phone: req.body.phone.replace(/\D/g, ''),
      image: req.file.filename,
      sellerId: sellerId,  // <-- IMPORTANT: save sellerId here
    });

    await item.save();

    res.status(201).json({
      success: true,
      item: {
        ...item.toObject(),
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/market/${req.file.filename}`
      },
      image: {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});



// GET endpoint
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    
    const itemsWithUrls = items.map(item => ({
      ...item.toObject(),
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/market/${item.image}`,
      sellerId: item.sellerId,
      createdAt: item.createdAt.toISOString()
    }));

    res.json({
      success: true,
      count: items.length,
      data: itemsWithUrls
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});


// this get is to get an item for that user

// Add this above your DELETE route
router.get('/:itemId', async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Add image URL if needed
    const itemWithUrl = {
      ...item,
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/market/${item.image}`
    };

    return res.status(200).json({
      success: true,
      data: itemWithUrl
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
  }
});

// routes/item.js
router.delete('/:itemId', authMiddleware, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' }); // Note the 'return'
    }

    // Convert both to String for reliable comparison
    if (item.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' }); // Note the 'return'
    }

    await Item.deleteOne({ _id: req.params.itemId });
    return res.status(200).json({ success: true }); // Final 'return'
    
  } catch (err) {
    next(err); // Pass to error handler
  }
});


module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const Employer = require('../models/Employer');
const router = express.Router();
const protect = require('../middlewares/authMiddleware'); 


// Setup multer with diskStorage + file type validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const isOctetWithValidExtension = (
    file.mimetype === 'application/octet-stream' &&
    ['.pdf', '.jpg', '.jpeg', '.png'].some(ext => file.originalname.endsWith(ext))
  );

  if (allowedTypes.includes(file.mimetype) || isOctetWithValidExtension) {
    return cb(null, true);
  } else {
    return cb(new Error('Only image files (jpeg, jpg, png) and document files (pdf, doc, docx) are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter
});

// Route to handle employer registration
router.post('/',protect,  upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const profileImage = req.file;

    if (!name || !email || !phone || !profileImage) {
      return res.status(400).json({ error: 'Please provide name, email, phone and profile image' });
    }

    const newEmployer = new Employer({
      name,
      email,
      phone,
      profileImageUrl: `/uploads/${profileImage.filename}`
    });

    await newEmployer.save();

    res.status(201).json({
      message: 'Employer registered successfully',
      data: newEmployer
    });
  } catch (error) {
    console.error('Error saving employer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

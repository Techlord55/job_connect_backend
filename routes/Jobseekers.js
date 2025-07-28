


const express = require('express');
const multer = require('multer');
const Application = require('../models/Jobseekers'); // Ensure this path is correct
const protect = require('../middlewares/authMiddleware'); 

const router = express.Router();

// Disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'resume', maxCount: 3 }
  ]),
  async (req, res) => {
    const { name, email, phone } = req.body;
    
    const profileImage = req.files?.profileImage?.[0] || null;

    const profileImageData = profileImage
      ? {
          filename: profileImage.filename,
          size: profileImage.size,
          mimetype: profileImage.mimetype,
          path: profileImage.path,
        }
      : null;


    const resumeFiles = (req.files?.resume || []).map(file => ({
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone'
      });
    }

    try {
      const application = new Application({
        name,
        email,
        phone,
        profileImage: profileImageData,
        resume: resumeFiles
      });
      console.log('Files received:', req.files);
      console.log('ProfileImage file:', req.files?.profileImage);
      console.log('Resume files:', req.files?.resume);
      

      await application.save();

      return res.status(201).json({
        success: true,
        message: 'Saved successfully',
        data: application
      });
    } catch (error) {
      console.error('DB Save Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save to DB'
      });
    }
  }
);


module.exports = router;

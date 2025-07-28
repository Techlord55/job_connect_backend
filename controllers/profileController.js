// controllers/profileController.js
const Profile = require('../models/Profile');

exports.createProfile = async (req, res) => {
  try {
    const { role, skills, experience, availability } = req.body;
    const resumeUrl = req.files?.resume?.[0]?.path || '';
    const imageUrl = req.files?.image?.[0]?.path || '';

    const newProfile = new Profile({
      role,
      skills,
      experience,
      availability,
      resumeUrl,
      imageUrl,
    });

    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

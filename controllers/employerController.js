const { Router } = require('express');
const Employer = require('./ models/Employer'); // <--- ✅ THIS IS IMPORTANT!



Router.post('/api/employers', upload.single('profileImage'), async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      const profileImage = req.file;
      console.log('👉 Received Body:', req.body);
      console.log('👉 Received Files:', req.file);
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
  
      console.log('New Employer saved to database:', newEmployer);
  
      res.status(201).json({
        message: 'Employer registered successfully',
        data: newEmployer
        
      });
  
    } catch (error) {
      console.error('Error saving employer:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
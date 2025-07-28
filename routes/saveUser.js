
const express = require('express');
const router = express.Router();
const { generateAccessToken } = require('../utils/generateToken');

const User = require('../models/User'); // adjust path


router.post('/save-user', async (req, res) => {
    const { logto_id, email, name, picture} = req.body;
  
    try {
      let user = await User.findOne({ logto_id });
  
      if (!user) {
        user = await User.create({
          logto_id,
          email,
          fullName: name || '',
          password: null, // password not used for social login
          phone: null,
          avatar: picture || null,
        });

 

  
  
        console.log('✅ New user created:', user.email);
      } else {
        console.log('ℹ️ User already exists:', user.email);
      }

       const accessToken = generateAccessToken(user);
  
      res.status(200).json({
        success: true,
        token: accessToken,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
        }
      });

     
    } catch (error) {
      console.error('❌ Error saving user:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

  module.exports = router;
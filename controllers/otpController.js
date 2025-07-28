const { Vonage } = require('@vonage/server-sdk');
const crypto = require('crypto');
const User = require('../models/User'); // Assuming you have a User model

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

const otpStore = new Map(); // Temporary storage. Use Redis in production.

exports.sendOtp = async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });

  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 }); // Expires in 5 minutes

  vonage.sms.send({
    to: phone,
    from: process.env.VONAGE_FROM,
    text: `Your verification code is: ${otp}`
  })
  .then(() => res.json({ message: 'OTP sent via SMS' }))
  .catch(err => res.status(500).json({ message: 'SMS failed', error: err }));
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  const entry = otpStore.get(phone);

  if (!entry || entry.otp !== otp || Date.now() > entry.expires) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.password = newPassword; // Password should be hashed by pre-save hook
  await user.save();

  otpStore.delete(phone);
  res.json({ message: 'Password reset successful' });
};

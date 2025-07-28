const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  role: { type: String },
  refreshToken: { type: String },
  resetToken: { type: String },
  resetPasswordToken: { type: String },
  resetTokenExpiry: { type: Date },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  emailVerificationCode: String,
  phoneVerificationCode: String,
  logto_id: {
    type: String,
    required: false,  // optional
    sparse: true,     // allow multiple nulls
    unique: false     // not unique
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Sync indexes with the database every time the app starts
User.syncIndexes()
  .then(() => {
    console.log('Indexes synced successfully');
  })
  .catch(err => {
    console.error('Error syncing indexes:', err);
  });

module.exports = User;

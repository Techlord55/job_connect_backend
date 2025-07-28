const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  filename: String,
  size: Number,
  mimetype: String,
}, { _id: false }); // Prevents auto-generating _id for each resume item

const profileImageSchema = new mongoose.Schema({
  filename: String,
  size: Number,
  mimetype: String,
  data: Buffer,
  contentType: String,
}, { _id: false }); // Prevents auto-generating _id for profile image

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  profileImage: profileImageSchema, // single object
  resume: [resumeSchema], // array of resume metadata
}, { timestamps: true });

module.exports = mongoose.model('Jobseekers', applicationSchema);

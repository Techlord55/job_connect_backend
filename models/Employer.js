const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  profileImageUrl: { type: String, required: true },
}, { timestamps: true });

const Employer = mongoose.model('Employers', employerSchema);

module.exports = Employer;

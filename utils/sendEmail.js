// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (email, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use your SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MyApp" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    text:  text,
  });
};

module.exports = sendEmail;

const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (to, text) => {
  return client.messages.create({
    body: text,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};

module.exports = sendSMS;

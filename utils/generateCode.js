const crypto = require('crypto');

const generateCode = () => crypto.randomInt(100000, 999999).toString();

module.exports = generateCode;

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || 'Something went wrong',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Hide stack in production
  });
};

module.exports = { errorHandler };

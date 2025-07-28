// middlewares/authorizeEmployer.js
module.exports = (req, res, next) => {
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as employer'
      });
    }
    next();
  };
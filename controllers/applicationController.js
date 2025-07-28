// controllers/applicationController.js
const Application = require('../models/Application');

exports.getUserApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('jobId', 'title description companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};
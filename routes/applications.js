// routes/applications.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const authenticate = require('../middlewares/authMiddleware');

// Get all applications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('jobId', 'title description companyName')
      .sort({ createdAt: -1 });

    const formattedApplications = applications.map(app => ({
      fullName: app.fullName,
      id: app._id,
      jobTitle: app.jobId?.title,
      jobDescription: app.jobId?.description,
      companyName: app.jobId?.companyName,
      status: app.status,
      createdAt: app.createdAt.toLocaleDateString(),
      employerMessage: app.employerMessage
    }));

    res.json({ 
      success: true,
      data: formattedApplications 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch applications' 
    });
  }
});

router.get('/for-job/:jobId', authenticate, async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const applications = await Application.find({ jobId })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications.map(app => ({
        id: app._id,
        userId: app.userId?._id,
        fullName: app.userId?.fullName,
        email: app.userId?.email,
        status: app.status,
        employerMessage: app.employerMessage,
        appliedAt: app.createdAt,
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch applicants' });
  }
});


// Update application status (accept/reject)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['accepted', 'rejected', 'reviewed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'fullName email');

    if (!updated) return res.status(404).json({ error: 'Application not found' });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
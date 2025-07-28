// routes/jobs.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Job = require('../models/jobs');
const Application = require('../models/Application');
const authenticate = require('../middlewares//authMiddleware');
const authorizeEmployer = require('../middlewares/authorizeEmployer');
const User = require('../models/User')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/jobs/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all jobs posted by employer
router.get('/employer/jobs', authenticate, authorizeEmployer, async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user.id })
      .sort({ createdAt: -1 });

    // Count applications for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async job => {
        const applications = await Application.countDocuments({ jobId: job._id });
        return {
          ...job.toObject(),
          applications
        };
      })
    );

    res.json({ 
      success: true,
      data: jobsWithApplications 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch jobs' 
    });
  }
});
// Public job feed route
router.get('/public/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });

    // Count applications for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async job => {
        const applications = await Application.countDocuments({ jobId: job._id });
        return {
          ...job.toObject(),
          applications
        };
      })
    );

    res.json({
      success: true,
      data: jobsWithApplications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public jobs'
    });
  }
});



router.post('/jobs/apply', authenticate, async (req, res) => {
  const { jobId } = req.body;
  const userId = req.user.id;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const existingApp = await Application.findOne({ userId, jobId });
    if (existingApp) {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await Application.create({
      userId,
      fullName: user.fullName, // <-- Add user’s name here
      jobId
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applications: 1 } });

    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to apply for job' });
  }
});


// GET /api/applications
router.get('/jobs/applied', authenticate, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user.id }).populate('jobId'); // populate job details
    const data = apps.map(app => ({
      ...app.toObject(),
      job: app.jobId, // rename populated jobId to job
    }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});



// Create new job
router.post('/jobs', authenticate, authorizeEmployer, upload.single('image'), async (req, res) => {
  try {
    const { title, description, salary, location, jobType, industry } = req.body;
    
    if (!title || !description || !salary || !location || !jobType || !industry) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const job = new Job({
      title,
      description,
      salary,
      location,
      jobType,
      industry,
      employerId: req.user.id,
      imageUrl: req.file ? `/uploads/jobs/${req.file.filename}` : null
    });

    await job.save();

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create job'
    });
  }
});

// Delete a job
router.delete('/jobs/:id', authenticate, authorizeEmployer, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      employerId: req.user.id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Also delete all applications for this job
    await Application.deleteMany({ jobId: req.params.id });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
});



// GET /api/jobs/my-jobs → Get all jobs posted by the current employer

router.get('/jobs/my-jobs', authenticate, async (req, res) => {
  try {
    const employerId = req.user.id;
    const jobs = await Job.find({ employerId }).sort({ createdAt: -1 });

    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ jobId: job._id });
        return {
          id: job._id,
          title: job.title,
          description: job.description,
          industry: job.industry,
          applications: applicationCount,
          createdAt: job.createdAt
        };
      })
    );

    res.json({ success: true, data: jobsWithApplications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

module.exports = router;



module.exports = router;
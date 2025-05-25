const Job = require('../models/job');
const User = require('../models/user');


exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      location,
      salary,
      jobType,
      skillsRequired,
      experience,
      education,
      companyLogo,
      companyWebsite,
      companySize,
      companyType,
      industry,
      lookingFor,
      applyBy,
      deadline,
      language,
      aboutRole,
      aboutCompany,
      benifits,
      perks,
      url,
      applicationLink,
      hrEmail,
      remote,
      locationType,
      jobLevel,
      duration,
      rolesAndRes,
      openings,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || !company || !description || !location || !jobType || !hrEmail) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check user role
    if (!['admin', 'jobposter'].includes(req.user.userType)) {
      return res.status(403).json({ message: 'Unauthorized to post job' });
    }

    const job = new Job({
      title,
      company,
      description,
      location,
      salary,
      jobType,
      skillsRequired,
      experience,
      education,
      companyLogo,
      companyWebsite,
      companySize,
      companyType,
      industry,
      lookingFor,
      applyBy,
      deadline,
      language,
      aboutRole,
      aboutCompany,
      benifits,
      perks,
      url,
      applicationLink,
      hrEmail,
      remote,
      locationType,
      jobLevel,
      duration,
      rolesAndRes,
      openings,
      tags,
      postedBy: req.user.id,
      status: 'open',
    });

    await job.save();
    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get all open jobs
// Get all open jobs with optional filters
exports.getAllJobs = async (req, res) => {
  try {
    const { title, location, jobType, search } = req.query;

    const filter = { status: 'open' };

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    // General search in title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(filter)
    .sort({ createdAt: -1 }) // Sort by newest first
    .populate('postedBy', 'name mobile');


    res.json({
      message: "Filtered list of jobs",
      jobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get job by id
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name mobile');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get jobs posted by the current user (jobposter)
exports.getJobsByUser = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id });
    res.json({message : "list of my jobs", jobs:jobs});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a job (only owner jobposter/admin)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this job' });
    }

    // Update allowed fields
    const fields = ['title', 'company', 'description', 'location', 'salary', 'jobType', 'skillsRequired', 'status'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) job[field] = req.body[field];
    });

    await job.save();

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a job (only owner jobposter/admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this job' });
    }

    await job.remove();

    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Filter jobs with query params: location, jobType, skills
exports.filterJobs = async (req, res) => {
  try {
    const { location, jobType, skills } = req.query;

    const filter = { status: 'open' };

    if (location) filter.location = { $regex: location, $options: 'i' };
    if (jobType) filter.jobType = jobType;
    if (skills) filter.skillsRequired = { $all: skills.split(',') };

    const jobs = await Job.find(filter);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// User applies for a job
exports.applyJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    if (job.applicants && job.applicants.includes(userId)) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Add user to applicants array
    job.applicants = job.applicants || [];
    job.applicants.push(userId);
    await job.save();

    // Also add jobId to user's appliedJobs list
    const user = await User.findById(userId);
    user.appliedJobs = user.appliedJobs || [];
    if (!user.appliedJobs.includes(jobId)) {
      user.appliedJobs.push(jobId);
      await user.save();
    }

    res.json({ message: 'Applied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all jobs applied by the user
exports.getAppliedJobsByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('appliedJobs');
    res.json({message : "list of jobs", jobs: user.appliedJobs});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add/remove job from user's favorites
exports.toggleFavoriteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const user = await User.findById(req.user.id);

    user.favoriteJobs = user.favoriteJobs || [];

    if (user.favoriteJobs.includes(jobId)) {
      // Remove from favorites
      user.favoriteJobs = user.favoriteJobs.filter(j => j.toString() !== jobId);
      await user.save();
      return res.json({ message: 'Removed from favorites' });
    } else {
      // Add to favorites
      user.favoriteJobs.push(jobId);
      await user.save();
      return res.json({ message: 'Added to favorites' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's favorite jobs
exports.getFavoriteJobsByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favoriteJobs');
    res.json({message : "list of jobs", jobs: user.favoriteJobs});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

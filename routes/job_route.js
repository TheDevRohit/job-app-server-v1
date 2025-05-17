const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth_middlewars');
const {
  createJob,
  getAllJobs,
  getJobById,
  getJobsByUser,
  filterJobs,
  updateJob,
  deleteJob,
  applyJob,
  getAppliedJobsByUser,
  toggleFavoriteJob,
  getFavoriteJobsByUser,
} = require('../controllers/job_controller');

// Create a job (auth required)
router.post('/', auth, createJob);

// Get all open jobs (public)
router.get('/', getAllJobs);

// Filter jobs (public)
router.get('/filter', filterJobs);

// Get jobs posted by logged-in user (auth required)
router.get('/user', auth, getJobsByUser);

// Get job details by id (public)
router.get('/:id', getJobById);

// Update job by id (auth required)
router.put('/:id', auth, updateJob);

// Delete job by id (auth required)
router.delete('/:id', auth, deleteJob);

// Apply to a job (auth required)
router.post('/:id/apply', auth, applyJob);

// Get all jobs applied by logged-in user (auth required)
router.get('/applied/user', auth, getAppliedJobsByUser);

// Add/remove favorite job (auth required)
router.post('/:id/favorite', auth, toggleFavoriteJob);

// Get favorite jobs of logged-in user (auth required)
router.get('/favorites/user', auth, getFavoriteJobsByUser);

module.exports = router;

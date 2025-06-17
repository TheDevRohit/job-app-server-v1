const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin_controller');
const  auth  = require('../middlewares/auth_middlewars'); // your auth middleware

router.get('/admin/dashboard', auth, adminController.getAdminDashboardStats);
router.get('/user/all' , adminController.getAllUsers);
router.get('/notification/all', auth, adminController.getAllNotifications);
router.get('/applied/all', auth, adminController.getAllAppliedJobs);
module.exports = router;

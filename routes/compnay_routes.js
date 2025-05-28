const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company_controller');

// Create
router.post('/', companyController.createCompany);

// Read
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);

// Update
router.put('/:id', companyController.updateCompany);

// Delete
router.delete('/:id', companyController.deleteCompany);

module.exports = router;

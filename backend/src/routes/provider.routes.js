const express = require('express');
const router = express.Router();
const { getAllProviders } = require('../controllers/providerController');

// Public route to get active providers
router.get('/', getAllProviders);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getAllUsers,
  banUser,
  deleteUser,
  createMovie,
  updateMovie,
  deleteMovie,
  getAllAdminMovies,
  deleteAdminReview
} = require('../controllers/adminController');

const {
  getAllProvidersAdmin,
  createProvider,
  updateProvider,
  deleteProvider
} = require('../controllers/providerController');

// All routes require authentication + admin role
router.use(protect, admin);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);

// Movie management
router.post('/movies', createMovie);
router.put('/movies/:id', updateMovie);
router.delete('/movies/:id', deleteMovie);
router.get('/movies', getAllAdminMovies);

// Provider management
router.get('/providers', getAllProvidersAdmin);
router.post('/providers', createProvider);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// Reviews management
router.delete('/reviews/:id', deleteAdminReview);

module.exports = router;

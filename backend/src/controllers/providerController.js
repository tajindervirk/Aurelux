const Provider = require('../models/Provider');

// @desc    Get all active providers (Public)
// @route   GET /api/providers
// @access  Public
exports.getAllProviders = async (req, res, next) => {
  try {
    const providers = await Provider.find({ isActive: true }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching providers' });
  }
};

// @desc    Get all providers including inactive (Admin)
// @route   GET /api/admin/providers
// @access  Private/Admin
exports.getAllProvidersAdmin = async (req, res, next) => {
  try {
    const providers = await Provider.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching providers' });
  }
};

// @desc    Create a provider
// @route   POST /api/admin/providers
// @access  Private/Admin
exports.createProvider = async (req, res, next) => {
  try {
    const { providerId } = req.body;
    // Check if provider ID already exists
    const existing = await Provider.findOne({ providerId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Provider ID already exists' });
    }

    const provider = await Provider.create(req.body);
    res.status(201).json({ success: true, data: provider });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Error creating provider' });
  }
};

// @desc    Update a provider
// @route   PUT /api/admin/providers/:id
// @access  Private/Admin
exports.updateProvider = async (req, res, next) => {
  try {
    let provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    provider = await Provider.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Error updating provider' });
  }
};

// @desc    Delete a provider
// @route   DELETE /api/admin/providers/:id
// @access  Private/Admin
exports.deleteProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    await provider.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting provider' });
  }
};

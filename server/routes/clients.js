const express = require('express');
const Client = require('../models/Client');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authMiddleware to all client routes
router.use(authMiddleware);

// @route   POST /api/clients
// @desc    Create a new client
// @access  Private (Freelancer only)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, companyName, currency } = req.body;

    // Simple validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    const client = new Client({
      freelancerId: req.user._id,
      name,
      email,
      phone: phone || '',
      companyName: companyName || '',
      currency: currency || 'USD',
    });

    await client.save();
    res.status(201).json({ client });
  } catch (error) {
    console.error('Create Client Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not create client.' });
  }
});

// @route   GET /api/clients
// @desc    Get all clients for logged in freelancer
// @access  Private (Freelancer only)
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find({ freelancerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ clients });
  } catch (error) {
    console.error('Get Clients Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not fetch clients.' });
  }
});

// @route   GET /api/clients/:id
// @desc    Get a single client by ID
// @access  Private (Freelancer only)
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      freelancerId: req.user._id,
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found or unauthorized.' });
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error('Get Client By ID Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Client not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not retrieve client details.' });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update a client by ID
// @access  Private (Freelancer only)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, companyName, currency } = req.body;

    // Simple validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, freelancerId: req.user._id },
      { name, email, phone: phone || '', companyName: companyName || '', currency: currency || 'USD' },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ error: 'Client not found or unauthorized.' });
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error('Update Client Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Client not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not update client.' });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete a client by ID
// @access  Private (Freelancer only)
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      freelancerId: req.user._id,
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found or unauthorized.' });
    }

    res.status(200).json({ message: 'Client deleted successfully.' });
  } catch (error) {
    console.error('Delete Client Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Client not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not delete client.' });
  }
});

module.exports = router;

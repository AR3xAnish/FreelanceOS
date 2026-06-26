const express = require('express');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const { generatePdfBuffer } = require('../utils/pdfGenerator');

const router = express.Router();

// @route   GET /api/portal/:token
// @desc    Get client and their invoices via portal token (Public)
router.get('/:token', async (req, res) => {
  try {
    const client = await Client.findOne({ portalToken: req.params.token })
      .populate('freelancerId', 'name businessName email logo address gstNumber currency');

    if (!client) {
      return res.status(404).json({ error: 'Invalid or expired client portal link.' });
    }

    // Find all invoices associated with this client
    const invoices = await Invoice.find({ clientId: client._id }).sort({ createdAt: -1 });

    res.status(200).json({
      client,
      invoices
    });
  } catch (error) {
    console.error('Fetch Portal Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not retrieve portal details.' });
  }
});

// @route   PATCH /api/portal/:token/invoices/:id/approve
// @desc    Approve an invoice from the client portal (Public)
router.patch('/:token/invoices/:id/approve', async (req, res) => {
  try {
    const client = await Client.findOne({ portalToken: req.params.token });
    if (!client) {
      return res.status(404).json({ error: 'Invalid or expired client portal link.' });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      clientId: client._id
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    invoice.approved = true;
    await invoice.save();

    res.status(200).json({
      message: 'Invoice approved successfully.',
      invoice
    });
  } catch (error) {
    console.error('Approve Invoice Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not approve invoice.' });
  }
});

// @route   GET /api/portal/:token/invoices/:id/pdf
// @desc    Download invoice PDF from public client portal
// @access  Public
router.get('/:token/invoices/:id/pdf', async (req, res) => {
  try {
    const client = await Client.findOne({ portalToken: req.params.token })
      .populate('freelancerId', 'name businessName email logo address gstNumber currency');
      
    if (!client) {
      return res.status(404).json({ error: 'Invalid or expired client portal link.' });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      clientId: client._id
    }).populate('clientId', 'name email companyName currency phone')
      .populate('freelancerId', 'name email businessName address gstNumber currency');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    // Generate the PDF buffer
    const pdfBuffer = await generatePdfBuffer(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Portal PDF Download Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not generate PDF.' });
  }
});

module.exports = router;

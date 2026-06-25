const express = require('express');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/authMiddleware');
const { generatePdfBuffer } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/sendEmail');

const router = express.Router();

// Protect all routes with authMiddleware
router.use(authMiddleware);

// @route   POST /api/invoices
// @desc    Create a new invoice
// @access  Private (Freelancer only)
router.post('/', async (req, res) => {
  try {
    const { clientId, lineItems, status, dueDate, notes } = req.body;

    // Simple validation
    if (!clientId || !dueDate) {
      return res.status(400).json({ error: 'Client ID and Due Date are required fields.' });
    }

    const invoice = new Invoice({
      freelancerId: req.user._id,
      clientId,
      lineItems: lineItems || [],
      status: status || 'unpaid',
      dueDate,
      notes: notes || '',
    });

    await invoice.save();
    res.status(201).json({ invoice });
  } catch (error) {
    console.error('Create Invoice Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not create invoice.' });
  }
});

// @route   GET /api/invoices
// @desc    Get all invoices for logged in freelancer (with filters)
// @access  Private (Freelancer only)
router.get('/', async (req, res) => {
  try {
    const { status, clientId } = req.query;
    
    // Build filter query
    const filter = { freelancerId: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    if (clientId) {
      filter.clientId = clientId;
    }

    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name email companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({ invoices });
  } catch (error) {
    console.error('Get Invoices Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not fetch invoices.' });
  }
});

// @route   GET /api/invoices/:id/pdf
// @desc    Generate a PDF for a single invoice
// @access  Private (Freelancer only)
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      freelancerId: req.user._id,
    })
      .populate('clientId', 'name email companyName currency phone')
      .populate('freelancerId', 'name email businessName address gstNumber currency');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    const pdfBuffer = await generatePdfBuffer(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber || 'draft'}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer, 'binary');

  } catch (error) {
    console.error('PDF Generation Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not generate PDF.' });
  }
});

// @route   POST /api/invoices/:id/send-email
// @desc    Send the invoice PDF email to client
// @access  Private (Freelancer only)
router.post('/:id/send-email', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      freelancerId: req.user._id,
    })
      .populate('clientId', 'name email companyName currency phone')
      .populate('freelancerId', 'name email businessName address gstNumber currency');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    if (!invoice.clientId || !invoice.clientId.email) {
      return res.status(400).json({ error: 'Client email is missing.' });
    }

    // Call helper function to trigger nodemailer
    const emailResult = await sendInvoiceEmail(invoice, invoice.clientId, invoice.freelancerId);

    const isMock = emailResult && emailResult.mockSent;
    res.status(200).json({ 
      message: isMock 
        ? 'Invoice email generated in mock mode (SMTP credentials not configured).' 
        : 'Invoice email sent successfully.' 
    });
  } catch (error) {
    console.error('Send Email Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not send email.' });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get a single invoice by ID
// @access  Private (Freelancer only)
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      freelancerId: req.user._id,
    })
      .populate('clientId', 'name email companyName currency phone')
      .populate('freelancerId', 'name email businessName address gstNumber currency');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    res.status(200).json({ invoice });
  } catch (error) {
    console.error('Get Invoice By ID Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not retrieve invoice.' });
  }
});

// @route   PUT /api/invoices/:id
// @desc    Update an invoice by ID
// @access  Private (Freelancer only)
router.put('/:id', async (req, res) => {
  try {
    const { clientId, lineItems, status, dueDate, notes } = req.body;

    if (!clientId || !dueDate) {
      return res.status(400).json({ error: 'Client ID and Due Date are required fields.' });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      freelancerId: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    // Update attributes
    invoice.clientId = clientId;
    invoice.lineItems = lineItems || [];
    invoice.status = status || invoice.status;
    invoice.dueDate = dueDate;
    invoice.notes = notes || '';

    await invoice.save(); // save() triggers pre-save calculation hooks!
    res.status(200).json({ invoice });
  } catch (error) {
    console.error('Update Invoice Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not update invoice.' });
  }
});

// @route   PATCH /api/invoices/:id/status
// @desc    Update only the status of an invoice
// @access  Private (Freelancer only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['unpaid', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Valid status ("unpaid", "paid", "overdue") is required.' });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, freelancerId: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    res.status(200).json({ invoice });
  } catch (error) {
    console.error('Patch Invoice Status Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not update invoice status.' });
  }
});

// @route   DELETE /api/invoices/:id
// @desc    Delete an invoice by ID
// @access  Private (Freelancer only)
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      freelancerId: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    res.status(200).json({ message: 'Invoice deleted successfully.' });
  } catch (error) {
    console.error('Delete Invoice Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not delete invoice.' });
  }
});

module.exports = router;

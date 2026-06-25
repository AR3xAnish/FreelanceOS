const express = require('express');
const puppeteer = require('puppeteer');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/authMiddleware');

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

    const freelancer = invoice.freelancerId || {};
    const client = invoice.clientId || {};
    
    const formatDate = (dateVal) => {
      if (!dateVal) return '';
      const date = new Date(dateVal);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const dateFormatted = formatDate(invoice.createdAt);
    const dueDateFormatted = formatDate(invoice.dueDate);

    // Determine currency symbol
    const clientCurrency = client.currency || freelancer.currency || 'USD';
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      CAD: 'CA$',
      AUD: 'A$',
      JPY: '¥'
    };
    const currencySymbol = currencySymbols[clientCurrency] || clientCurrency + ' ';

    // HTML template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber || 'Draft'}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1f2937;
      margin: 0;
      padding: 40px;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f3f4f6;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .logo-container {
      font-size: 24px;
      font-weight: 700;
      color: #10B981;
    }
    .logo-container span {
      color: #111827;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      margin: 0 0 4px 0;
      font-size: 24px;
      color: #111827;
      font-weight: 700;
    }
    .invoice-title .meta {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }
    .details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 20px;
    }
    .details .col {
      width: 48%;
    }
    .details h3 {
      margin: 0 0 12px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      font-weight: 600;
    }
    .details p {
      margin: 0 0 6px 0;
      font-size: 13px;
      color: #374151;
    }
    .details .name {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      margin-bottom: 30px;
    }
    th {
      border-bottom: 2px solid #e5e7eb;
      padding: 12px 8px;
      font-weight: 600;
      color: #374151;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td {
      padding: 14px 8px;
      border-bottom: 1px solid #f3f4f6;
      color: #4b5563;
      font-size: 13px;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-table {
      width: 40%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 8px 8px;
      border: none;
      font-size: 13px;
      color: #4b5563;
    }
    .totals-table tr.grand-total td {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-paid {
      background-color: #ecfdf5;
      color: #047857;
    }
    .status-unpaid {
      background-color: #fffbeb;
      color: #b45309;
    }
    .status-overdue {
      background-color: #fef2f2;
      color: #b91c1c;
    }
    .notes {
      margin-top: 40px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    .notes h4 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      font-weight: 600;
    }
    .notes p {
      margin: 0;
      font-size: 12px;
      color: #4b5563;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="logo-container">
        Freelance<span>OS</span>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="meta">
          <strong>Invoice #:</strong> ${invoice.invoiceNumber || 'N/A'}<br>
          <strong>Date:</strong> ${dateFormatted}<br>
          <strong>Due Date:</strong> ${dueDateFormatted}
        </div>
      </div>
    </div>

    <div class="details">
      <div class="col">
        <h3>From</h3>
        <p class="name">${freelancer.businessName || freelancer.name || 'Freelancer'}</p>
        ${freelancer.address ? `<p>${freelancer.address}</p>` : ''}
        <p>Email: ${freelancer.email || ''}</p>
        ${freelancer.gstNumber ? `<p>GSTIN: ${freelancer.gstNumber}</p>` : ''}
      </div>
      <div class="col">
        <h3>To</h3>
        <p class="name">${client.name || 'Client'}</p>
        ${client.companyName ? `<p>${client.companyName}</p>` : ''}
        ${client.phone ? `<p>Phone: ${client.phone}</p>` : ''}
        <p>Email: ${client.email || ''}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service Description</th>
          <th class="text-right" style="width: 100px;">Rate</th>
          <th class="text-right" style="width: 80px;">Qty</th>
          <th class="text-right" style="width: 120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lineItems.map(item => `
          <tr>
            <td>${item.service}</td>
            <td class="text-right">${currencySymbol}${Number(item.rate).toFixed(2)}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${currencySymbol}${Number(item.amount).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <table class="totals-table">
        <tr>
          <td>Status</td>
          <td class="text-right">
            <span class="status-badge status-${invoice.status}">
              ${invoice.status}
            </span>
          </td>
        </tr>
        <tr class="grand-total">
          <td>Total Due</td>
          <td class="text-right">${currencySymbol}${Number(invoice.totalAmount).toFixed(2)}</td>
        </tr>
      </table>
    </div>

    ${invoice.notes ? `
      <div class="notes">
        <h4>Notes / Payment Terms</h4>
        <p>${invoice.notes}</p>
      </div>
    ` : ''}
  </div>
</body>
</html>
    `;

    // Launch puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();

    // Send PDF buffer as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber || 'draft'}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer, 'binary');

  } catch (error) {
    console.error('PDF Generation Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not generate PDF.' });
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

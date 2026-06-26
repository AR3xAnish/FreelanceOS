const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  rate: {
    type: Number,
    required: true,
    default: 0,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema({
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  invoiceNumber: {
    type: String,
  },
  lineItems: [lineItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue'],
    default: 'unpaid',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  rejectedAt: {
    type: Date,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Compound index to ensure invoiceNumber is unique per freelancer
invoiceSchema.index({ freelancerId: 1, invoiceNumber: 1 }, { unique: true });

// Pre-save hook to calculate amounts and auto-generate invoiceNumber
invoiceSchema.pre('save', async function (next) {
  // 1. Auto-generate invoice number if new
  if (this.isNew && !this.invoiceNumber) {
    try {
      const count = await this.constructor.countDocuments({ freelancerId: this.freelancerId });
      const nextNum = String(count + 1).padStart(3, '0');
      this.invoiceNumber = `INV-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }

  // 2. Calculate line item amounts and total amount
  let total = 0;
  if (this.lineItems && this.lineItems.length > 0) {
    this.lineItems.forEach(item => {
      item.amount = (item.quantity || 0) * (item.rate || 0);
      total += item.amount;
    });
  }
  this.totalAmount = total;

  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;

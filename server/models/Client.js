const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  companyName: {
    type: String,
    trim: true,
    default: '',
  },
  currency: {
    type: String,
    default: 'USD',
  },
}, {
  timestamps: true,
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;

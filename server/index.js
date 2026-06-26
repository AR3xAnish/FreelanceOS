const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { initCronJobs } = require('./utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freelanceos';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const portalRoutes = require('./routes/portal');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portal', portalRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Database connection & Server start
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Connected to MongoDB database successfully');
    initCronJobs();
    // Keep this for local development
    if (process.env.NODE_ENV !== 'production') {
      app.listen(5000, () => {
        console.log('Server running on port 5000');
      });
    }
  })

  .catch((error) => {
    console.error('MongoDB database connection error:', error.message);
    console.log('Starting server anyway for healthcheck fallback...');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (without DB connection)`);
    });
  });

// Export for Vercel
module.exports = app;

const express = require('express');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const freelancerId = req.user._id;

    // 1. Fetch all invoices & expenses for this freelancer
    const [invoices, expenses] = await Promise.all([
      Invoice.find({ freelancerId }).populate('clientId', 'name companyName'),
      Expense.find({ freelancerId })
    ]);

    // 2. Calculate Top-level Metrics
    let totalEarned = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    const statusCounts = {
      paid: 0,
      unpaid: 0,
      overdue: 0
    };

    const statusAmounts = {
      paid: 0,
      unpaid: 0,
      overdue: 0
    };

    invoices.forEach(inv => {
      const status = inv.status || 'unpaid';
      if (status === 'paid') {
        totalEarned += inv.totalAmount;
      } else if (status === 'unpaid') {
        pendingAmount += inv.totalAmount;
      } else if (status === 'overdue') {
        overdueAmount += inv.totalAmount;
      }

      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
        statusAmounts[status] += inv.totalAmount;
      }
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = totalEarned - totalExpenses;

    // 3. Status Breakdown for Pie Chart (Paid vs Unpaid vs Overdue)
    const pieData = [
      { name: 'Paid', value: statusCounts.paid, amount: statusAmounts.paid, color: '#10B981' },
      { name: 'Unpaid', value: statusCounts.unpaid, amount: statusAmounts.unpaid, color: '#F59E0B' },
      { name: 'Overdue', value: statusCounts.overdue, amount: statusAmounts.overdue, color: '#EF4444' }
    ];

    // 4. Monthly Revenue for Last 6 Months (Bar Chart)
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        revenue: 0
      });
    }

    invoices.forEach(inv => {
      if (inv.status === 'paid') {
        const invDate = new Date(inv.createdAt);
        const invYear = invDate.getFullYear();
        const invMonth = invDate.getMonth();

        const match = months.find(m => m.year === invYear && m.monthIndex === invMonth);
        if (match) {
          match.revenue += inv.totalAmount;
        }
      }
    });

    // Clean up months array for the frontend (removing helper indices)
    const monthlyRevenue = months.map(m => ({
      name: `${m.name} ${m.year}`,
      revenue: parseFloat(m.revenue.toFixed(2))
    }));

    // 5. Top 3 Clients by Revenue (List)
    const clientRevenueMap = {};
    invoices.forEach(inv => {
      if (inv.status === 'paid' && inv.clientId) {
        const cId = inv.clientId._id.toString();
        if (!clientRevenueMap[cId]) {
          clientRevenueMap[cId] = {
            id: cId,
            name: inv.clientId.name,
            company: inv.clientId.companyName || 'Individual',
            revenue: 0
          };
        }
        clientRevenueMap[cId].revenue += inv.totalAmount;
      }
    });

    const topClients = Object.values(clientRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(c => ({
        ...c,
        revenue: parseFloat(c.revenue.toFixed(2))
      }));

    // 6. Recent Invoices (limit to 5)
    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(inv => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientId?.name || 'Unknown Client',
        companyName: inv.clientId?.companyName || '',
        totalAmount: parseFloat(inv.totalAmount.toFixed(2)),
        status: inv.status,
        dueDate: inv.dueDate,
        createdAt: inv.createdAt
      }));

    res.status(200).json({
      summary: {
        totalEarned: parseFloat(totalEarned.toFixed(2)),
        pendingAmount: parseFloat(pendingAmount.toFixed(2)),
        overdueAmount: parseFloat(overdueAmount.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2))
      },
      pieData,
      monthlyRevenue,
      topClients,
      recentInvoices
    });
  } catch (error) {
    console.error('Fetch Dashboard Stats Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not calculate dashboard statistics.' });
  }
});

module.exports = router;

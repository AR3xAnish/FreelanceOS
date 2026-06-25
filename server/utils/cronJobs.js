const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const { sendReminderEmail, sendOverdueEmail } = require('./sendEmail');

function initCronJobs() {
  // Cron schedules daily check at midnight ('0 0 * * *')
  // For verification, we can run it or keep it initialized
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily invoice status scanner...');
    
    try {
      const today = new Date();
      
      // 1. Find unpaid invoices due in exactly 3 days
      const reminderStart = new Date();
      reminderStart.setDate(today.getDate() + 3);
      reminderStart.setHours(0, 0, 0, 0);

      const reminderEnd = new Date();
      reminderEnd.setDate(today.getDate() + 3);
      reminderEnd.setHours(23, 59, 59, 999);

      const reminderInvoices = await Invoice.find({
        status: 'unpaid',
        dueDate: { $gte: reminderStart, $lte: reminderEnd }
      }).populate('clientId freelancerId');

      console.log(`[CRON] Found ${reminderInvoices.length} invoices due in 3 days.`);
      for (const invoice of reminderInvoices) {
        try {
          await sendReminderEmail(invoice, invoice.clientId);
          console.log(`[CRON] Sent reminder email for invoice ${invoice.invoiceNumber}`);
        } catch (err) {
          console.error(`[CRON] Failed to send reminder email for invoice ${invoice.invoiceNumber}:`, err.message);
        }
      }

      // 2. Find unpaid invoices past due date (due date is less than today's start)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const overdueInvoices = await Invoice.find({
        status: 'unpaid',
        dueDate: { $lt: todayStart }
      }).populate('clientId freelancerId');

      console.log(`[CRON] Found ${overdueInvoices.length} unpaid past-due invoices.`);
      for (const invoice of overdueInvoices) {
        try {
          // Update database status
          invoice.status = 'overdue';
          await invoice.save();
          
          // Send notification email
          await sendOverdueEmail(invoice, invoice.clientId);
          console.log(`[CRON] Marked invoice ${invoice.invoiceNumber} as overdue and sent alert email.`);
        } catch (err) {
          console.error(`[CRON] Failed to process overdue invoice ${invoice.invoiceNumber}:`, err.message);
        }
      }

    } catch (error) {
      console.error('[CRON] Error during daily invoice scan:', error.message);
    }
  });

  console.log('[CRON] Daily invoice due-date checking cron job initialized.');
}

module.exports = { initCronJobs };

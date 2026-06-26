const nodemailer = require('nodemailer');
const { generatePdfBuffer } = require('./pdfGenerator');

// Instantiate Gmail SMTP transport configuration defensively
const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;
const transporter = hasCredentials
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null;

if (!hasCredentials) {
  console.warn('WARNING: EMAIL_USER and EMAIL_PASS environment variables are not set. SMTP emails will run in MOCK mode.');
}

/**
 * Sends the invoice PDF as an attachment to the client.
 */
async function sendInvoiceEmail(invoice, client, freelancer) {
  if (!transporter) {
    console.log(`[MOCK EMAIL] sendInvoiceEmail: To: ${client.email}, Invoice: ${invoice.invoiceNumber}`);
    return { mockSent: true };
  }

  // Generate the PDF buffer
  const pdfBuffer = await generatePdfBuffer(invoice);
  const businessName = freelancer.businessName || freelancer.name || 'Freelancer';

  const mailOptions = {
    from: `"${businessName}" <${process.env.EMAIL_USER}>`,
    to: client.email,
    subject: `Invoice ${invoice.invoiceNumber} from ${businessName}`,
    text: `Hello ${client.name},\n\nPlease find attached invoice ${invoice.invoiceNumber} for the services rendered.\n\nTotal Amount Due: ${invoice.totalAmount} ${client.currency || 'USD'}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nBest regards,\n${freelancer.name}`,
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Sends a reminder email 3 days before the invoice due date.
 */
async function sendReminderEmail(invoice, client) {
  if (!transporter) {
    console.log(`[MOCK EMAIL] sendReminderEmail: To: ${client.email}, Invoice: ${invoice.invoiceNumber}`);
    return { mockSent: true };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: client.email,
    subject: `Friendly Reminder: Invoice ${invoice.invoiceNumber} is due in 3 days`,
    text: `Hello ${client.name},\n\nThis is a friendly reminder that invoice ${invoice.invoiceNumber} for the amount of ${invoice.totalAmount} ${client.currency || 'USD'} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nPlease arrange for payment by the due date.\n\nThank you!`
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Sends an urgent notification email when an invoice goes overdue.
 */
async function sendOverdueEmail(invoice, client) {
  if (!transporter) {
    console.log(`[MOCK EMAIL] sendOverdueEmail: To: ${client.email}, Invoice: ${invoice.invoiceNumber}`);
    return { mockSent: true };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: client.email,
    subject: `URGENT: Invoice ${invoice.invoiceNumber} is past due date`,
    text: `Hello ${client.name},\n\nOur records indicate that invoice ${invoice.invoiceNumber} for ${invoice.totalAmount} ${client.currency || 'USD'} is now past due. Its due date was ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nPlease arrange for immediate payment to settle this balance.\n\nThank you!`
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Sends a portal link email to the client.
 */
async function sendPortalEmail(client, freelancer, portalLink) {
  if (!transporter) {
    console.log(`[MOCK EMAIL] sendPortalEmail: To: ${client.email}, Link: ${portalLink}`);
    return { mockSent: true };
  }

  const businessName = freelancer.businessName || freelancer.name || 'Freelancer';
  const mailOptions = {
    from: `"${businessName}" <${process.env.EMAIL_USER}>`,
    to: client.email,
    subject: `Access your Client Portal - ${businessName}`,
    text: `Hello ${client.name},\n\n${businessName} has invited you to access your client portal. Here you can view all invoices sent to you, download PDF copies, and approve them.\n\nPlease click the link below to access your portal:\n${portalLink}\n\nBest regards,\n${freelancer.name}`
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendInvoiceEmail,
  sendReminderEmail,
  sendOverdueEmail,
  sendPortalEmail
};

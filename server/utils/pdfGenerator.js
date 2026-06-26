const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function generatePdfBuffer(invoice) {
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

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.276, 841.890]); // A4 size in postscript points
  const { width, height } = page.getSize();

  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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
  let currencySymbol = currencySymbols[clientCurrency] || clientCurrency + ' ';

  // Test if standard font can encode the symbol. If not, fallback to currency code
  try {
    helvetica.widthOfTextAtSize(currencySymbol, 10);
  } catch (e) {
    currencySymbol = clientCurrency + ' ';
  }

  // Colors
  const darkGray = rgb(0.12, 0.16, 0.23); // #1f2937
  const blackText = rgb(0.07, 0.09, 0.15); // #111827
  const grayText = rgb(0.42, 0.45, 0.5); // #6b7280
  const lightGrayText = rgb(0.61, 0.64, 0.69); // #9ca3af
  const emeraldGreen = rgb(0.06, 0.73, 0.51); // #10B981
  const borderLineColor = rgb(0.9, 0.9, 0.9);
  const lightBgColor = rgb(0.95, 0.96, 0.98);

  // Draw text helpers
  const drawText = (text, x, y, options = {}) => {
    const { font = helvetica, size = 10, color = darkGray } = options;
    page.drawText(String(text), { x, y, font, size, color });
  };

  const drawTextRight = (text, rightX, y, options = {}) => {
    const { font = helvetica, size = 10, color = darkGray } = options;
    const textWidth = font.widthOfTextAtSize(String(text), size);
    page.drawText(String(text), { x: rightX - textWidth, y, font, size, color });
  };

  // Header Logo Title
  drawText('Freelance', 40, 780, { font: helveticaBold, size: 22, color: emeraldGreen });
  const fWidth = helveticaBold.widthOfTextAtSize('Freelance', 22);
  drawText('OS', 40 + fWidth, 780, { font: helveticaBold, size: 22, color: blackText });

  // INVOICE title
  drawTextRight('INVOICE', 555, 780, { font: helveticaBold, size: 22, color: blackText });

  // Invoice meta
  let metaY = 760;
  drawTextRight(`Invoice #: ${invoice.invoiceNumber || 'N/A'}`, 555, metaY, { font: helveticaBold, size: 10, color: darkGray });
  metaY -= 14;
  drawTextRight(`Date: ${dateFormatted}`, 555, metaY, { size: 9, color: grayText });
  metaY -= 14;
  drawTextRight(`Due Date: ${dueDateFormatted}`, 555, metaY, { size: 9, color: grayText });

  // Horizontal Header Divider
  page.drawLine({
    start: { x: 40, y: 715 },
    end: { x: 555, y: 715 },
    thickness: 1,
    color: borderLineColor
  });

  // Sender Details (From)
  drawText('FROM', 40, 690, { font: helveticaBold, size: 9, color: lightGrayText });
  drawText(freelancer.businessName || freelancer.name || 'Freelancer', 40, 675, { font: helveticaBold, size: 12, color: blackText });
  
  let fromY = 660;
  if (freelancer.address) {
    const lines = freelancer.address.split('\n');
    lines.forEach(line => {
      drawText(line, 40, fromY, { size: 9, color: grayText });
      fromY -= 13;
    });
  }
  drawText(`Email: ${freelancer.email || ''}`, 40, fromY, { size: 9, color: grayText });
  fromY -= 13;
  if (freelancer.gstNumber) {
    drawText(`GSTIN: ${freelancer.gstNumber}`, 40, fromY, { size: 9, color: grayText });
    fromY -= 13;
  }

  // Recipient Details (To)
  drawText('TO', 320, 690, { font: helveticaBold, size: 9, color: lightGrayText });
  drawText(client.name || 'Client', 320, 675, { font: helveticaBold, size: 12, color: blackText });
  
  let toY = 660;
  if (client.companyName) {
    drawText(client.companyName, 320, toY, { font: helveticaBold, size: 9, color: emeraldGreen });
    toY -= 13;
  }
  if (client.phone) {
    drawText(`Phone: ${client.phone}`, 320, toY, { size: 9, color: grayText });
    toY -= 13;
  }
  drawText(`Email: ${client.email || ''}`, 320, toY, { size: 9, color: grayText });
  toY -= 13;

  // Let table start dynamically below the lowest y coordinate of From / To blocks
  const tableStartY = Math.min(fromY, toY) - 30;

  // Draw Table Headers
  drawText('Service Description', 40, tableStartY, { font: helveticaBold, size: 9, color: grayText });
  drawTextRight('Rate', 380, tableStartY, { font: helveticaBold, size: 9, color: grayText });
  drawTextRight('Qty', 450, tableStartY, { font: helveticaBold, size: 9, color: grayText });
  drawTextRight('Amount', 555, tableStartY, { font: helveticaBold, size: 9, color: grayText });

  // Border line under headers
  page.drawLine({
    start: { x: 40, y: tableStartY - 8 },
    end: { x: 555, y: tableStartY - 8 },
    thickness: 1.5,
    color: rgb(0.85, 0.85, 0.85)
  });

  // Table rows
  let itemY = tableStartY - 24;
  (invoice.lineItems || []).forEach(item => {
    const descText = item.service || '';
    const rateText = `${currencySymbol}${Number(item.rate).toFixed(2)}`;
    const qtyText = String(item.quantity);
    const amountText = `${currencySymbol}${Number(item.amount).toFixed(2)}`;

    // Wrap description if it exceeds 260 points width
    const maxDescWidth = 260;
    const words = descText.split(' ');
    let currentLine = '';
    let descLines = [];
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = helvetica.widthOfTextAtSize(testLine, 9);
      if (testWidth > maxDescWidth) {
        descLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) {
      descLines.push(currentLine);
    }
    if (descLines.length === 0) descLines.push('');

    // Draw description lines
    let textDrawY = itemY;
    descLines.forEach(line => {
      drawText(line, 40, textDrawY, { size: 9, color: darkGray });
      textDrawY -= 13;
    });

    // Draw numeric columns (on the first line y position)
    drawTextRight(rateText, 380, itemY, { size: 9, color: darkGray });
    drawTextRight(qtyText, 450, itemY, { size: 9, color: darkGray });
    drawTextRight(amountText, 555, itemY, { font: helveticaBold, size: 9, color: blackText });

    // Move to next item Y position
    const rowHeight = descLines.length * 13;
    itemY -= (rowHeight + 10);

    // Separator line between rows
    page.drawLine({
      start: { x: 40, y: itemY + 8 },
      end: { x: 555, y: itemY + 8 },
      thickness: 0.5,
      color: rgb(0.93, 0.93, 0.93)
    });
  });

  // Subtotal and Grand Total block
  let totalsY = itemY - 10;

  // Background box for status and total
  page.drawRectangle({
    x: 320,
    y: totalsY - 45,
    width: 235,
    height: 50,
    color: lightBgColor
  });

  // Invoice Status badge/text inside totals box
  drawText('Status:', 335, totalsY - 14, { size: 9, color: grayText });
  const statusStr = (invoice.status || 'unpaid').toUpperCase();
  const statusWidth = helveticaBold.widthOfTextAtSize(statusStr, 8);
  
  let badgeBgColor = rgb(0.9, 0.9, 0.9);
  let badgeTextColor = rgb(0.3, 0.3, 0.3);
  if (invoice.status === 'paid') {
    badgeBgColor = rgb(0.92, 0.99, 0.96); // #ecfdf5
    badgeTextColor = rgb(0.02, 0.47, 0.34); // #047857
  } else if (invoice.status === 'unpaid') {
    badgeBgColor = rgb(1.0, 0.98, 0.92); // #fffbeb
    badgeTextColor = rgb(0.7, 0.33, 0.04); // #b45309
  } else if (invoice.status === 'overdue') {
    badgeBgColor = rgb(1.0, 0.95, 0.95); // #fef2f2
    badgeTextColor = rgb(0.73, 0.11, 0.11); // #b91c1c
  }

  // Draw status badge rectangle
  page.drawRectangle({
    x: 540 - statusWidth - 12,
    y: totalsY - 17,
    width: statusWidth + 12,
    height: 14,
    color: badgeBgColor
  });
  // Draw status badge text
  page.drawText(statusStr, {
    x: 540 - statusWidth - 6,
    y: totalsY - 13,
    font: helveticaBold,
    size: 8,
    color: badgeTextColor
  });

  // Grand Total line
  drawText('Total Due:', 335, totalsY - 36, { font: helveticaBold, size: 10, color: blackText });
  drawTextRight(`${currencySymbol}${Number(invoice.totalAmount).toFixed(2)}`, 540, totalsY - 36, { font: helveticaBold, size: 12, color: emeraldGreen });

  // Notes & payment terms
  if (invoice.notes) {
    const notesY = totalsY - 80;
    drawText('Notes / Payment Terms', 40, notesY, { font: helveticaBold, size: 9, color: lightGrayText });
    
    // Draw notes lines
    let currentNotesY = notesY - 15;
    const noteLines = invoice.notes.split('\n');
    noteLines.forEach(line => {
      // Basic word-wrapping for notes
      const maxNoteWidth = 515;
      const noteWords = line.split(' ');
      let currentNoteLine = '';
      
      noteWords.forEach(word => {
        const testLine = currentNoteLine + (currentNoteLine ? ' ' : '') + word;
        const testWidth = helvetica.widthOfTextAtSize(testLine, 9);
        if (testWidth > maxNoteWidth) {
          drawText(currentNoteLine, 40, currentNotesY, { size: 9, color: grayText });
          currentNotesY -= 13;
          currentNoteLine = word;
        } else {
          currentNoteLine = testLine;
        }
      });
      if (currentNoteLine) {
        drawText(currentNoteLine, 40, currentNotesY, { size: 9, color: grayText });
        currentNotesY -= 13;
      }
    });
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generatePdfBuffer };

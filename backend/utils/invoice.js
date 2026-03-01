const escapePdfText = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));

const buildInvoiceLines = (order) => {
  const lines = [];
  const orderNo = String(order._id || '').slice(-8).toUpperCase();
  const date = new Date(order.createdAt || Date.now()).toLocaleString('en-IN');

  lines.push('Bharat Basket - Invoice');
  lines.push(`Invoice: INV-${orderNo}`);
  lines.push(`Order ID: ${order._id}`);
  lines.push(`Date: ${date}`);
  lines.push(`Customer: ${order.user?.name || order.shippingAddress?.fullName || 'N/A'}`);
  lines.push(`Email: ${order.user?.email || 'N/A'}`);
  lines.push(`Payment Method: ${order.paymentMethod || 'N/A'}`);
  lines.push(`Payment Status: ${order.paymentStatus || 'N/A'}`);
  lines.push('');
  lines.push('Items:');

  (order.items || []).forEach((item, index) => {
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
    lines.push(
      `${index + 1}. ${item.name || item.product?.name || 'Product'} | Qty: ${item.quantity} | Rate: ${formatMoney(item.price)} | Total: ${formatMoney(lineTotal)}`
    );
  });

  lines.push('');
  lines.push(`Grand Total: ${formatMoney(order.totalAmount)}`);
  lines.push('');
  lines.push('Shipping Address:');
  lines.push(`${order.shippingAddress?.fullName || ''} (${order.shippingAddress?.phone || ''})`);
  lines.push(`${order.shippingAddress?.addressLine1 || ''} ${order.shippingAddress?.addressLine2 || ''}`.trim());
  lines.push(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}`.trim());
  lines.push('');
  lines.push('Thank you for shopping with Bharat Basket.');

  return lines;
};

const generateSimplePdfBuffer = (lines) => {
  const textCommands = lines
    .map((line, i) => `${i === 0 ? '' : 'T*'}(${escapePdfText(line)}) Tj`)
    .join('\n');

  const contentStream = `BT
/F1 11 Tf
50 770 Td
14 TL
${textCommands}
ET`;

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let body = '';
  const offsets = [0];
  let cursor = Buffer.byteLength('%PDF-1.4\n', 'utf8');

  objects.forEach((obj) => {
    offsets.push(cursor);
    body += obj;
    cursor += Buffer.byteLength(obj, 'utf8');
  });

  const xrefStart = cursor;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const pdf = `%PDF-1.4\n${body}${xref}${trailer}`;
  return Buffer.from(pdf, 'utf8');
};

const generateInvoicePdfBuffer = (order) => {
  const lines = buildInvoiceLines(order);
  return generateSimplePdfBuffer(lines);
};

const getInvoiceFileName = (order) => `invoice-${String(order._id || 'order')}.pdf`;

module.exports = {
  generateInvoicePdfBuffer,
  getInvoiceFileName
};

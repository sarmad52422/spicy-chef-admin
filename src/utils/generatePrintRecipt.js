export function generateReceiptHTML(data) {
  const {
    orderId,
    address,
    date,
    items,
    subtotal,
    discount,
    serviceFee,
    deliveryFee,
    tip,
    orderTotal,
    total,
    paymentMethod,
    paymentStatus,
    phoneNo
  } = data;

  const isCard = paymentMethod.toLowerCase().includes("card");
  const cardLast4 = isCard ? paymentMethod.slice(-4) : "";

  const formattedDate = new Date(date);
  const dateStr = formattedDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = formattedDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const tableRows = items
    .map(
      (item) => `
      <tr>
        <td style="word-break: break-word; font-size: 14px; font-weight: bold; max-width: 180px; border-bottom: 1px dashed #ccc;">${item.name}</td>
        <td class="text-center" style="font-size: 14px; border-bottom: 1px dashed #ccc;">${item.quantity}</td>
        <td class="text-end" style="font-size: 14px; border-bottom: 1px dashed #ccc;">${item.totalAmount}</td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome for icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap');
      
      body {
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        max-width: 80mm;
        margin: 0 auto;
        padding: 5px;
        color: #000;
        line-height: 1.3;
      }
      .header {
        text-align: center;
        margin-bottom: 8px;
      }
      .logo {
        font-weight: bold;
        font-size: 20px;
        margin-bottom: 3px;
      }
      .receipt-title {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin: 5px 0;
        text-transform: uppercase;
      }
      .divider {
        border-top: 2px dashed #000;
        margin: 8px 0;
      }
      .light-divider {
        border-top: 1px dashed #ccc;
        margin: 6px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        text-align: left;
        font-weight: bold;
        border-bottom: 2px dashed #000;
        padding: 4px 0;
      }
      td {
        padding: 4px 0;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .total-row {
        font-weight: bold;
        font-size: 15px;
      }
      .footer {
        margin-top: 10px;
        text-align: center;
        font-size: 12px;
      }
      .branding {
        margin-top: 15px;
        text-align: center;
        font-size: 12px;
      }
      .brand-name {
        font-weight: bold;
        position: relative;
        display: inline-block;
      }
      .brand-name:after {
        content: "®";
        font-size: 8px;
        vertical-align: super;
        margin-left: 1px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo">EAT ME ONLINE</div>
      <div>Tel: +44 7123 456789</div>
    </div>
    
    <div class="divider"></div>
    
    <div class="receipt-title">Order Receipt</div>
    
    <div class="text-center">
      <strong>Scheduled for Delivery</strong>
      <div>Requested for <b>${dateStr} at ${timeStr}</b></div>
      <div>Order #: ${orderId}</div>
    </div>
    
    <div class="light-divider"></div>
    
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    
    <div class="light-divider"></div>
    
    <table>
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${subtotal}</td>
      </tr>
      <tr>
        <td>Discount:</td>
        <td class="text-right">${discount}</td>
      </tr>
      <tr>
        <td>Service Fee:</td>
        <td class="text-right">${serviceFee}</td>
      </tr>
      <tr>
        <td>Delivery Fee:</td>
        <td class="text-right">${deliveryFee}</td>
      </tr>
      <tr>
        <td>Order Total:</td>
        <td class="text-right">${orderTotal}</td>
      </tr>
    </table>
    
    <div class="divider"></div>
    
    <table>
      <tr class="total-row">
        <td>TOTAL:</td>
        <td class="text-right">${total}</td>
      </tr>
    </table>
    
    <div class="light-divider"></div>
    
    <div>
      <div><strong>Paid By:</strong> ${isCard ? `Card ****${cardLast4}` : paymentMethod}</div>
      <div><strong>Status:</strong> ${paymentStatus}</div>
    </div>
    
    <div class="light-divider"></div>
    
    <div class="footer">
      <div><strong>IMPORTANT: FOR FOOD ALLERGEN INFO</strong></div>
      <div>Call the restaurant or check their menu</div>
    </div>
    
    <div class="light-divider"></div>
    
    <div>
      <div>Customer Phone: ${phoneNo}</div>
      <div>Delivery Address:</div>
      <div><strong>${address}</strong></div>
    </div>
    
    <div class="branding">
      <div class="brand-name">LuminarSoft</div>
      <div>TEL: +92 300 0256232</div>
      <div><i class="fas fa-laptop-code"></i> luminarsoft.co.uk</div>
    </div>
  </body>
  </html>
  `;
}
import React from "react";
import { format } from "date-fns";
import { Table } from "react-bootstrap";

const OrderDetails = ({
  orderId,
  address,
  date,
  items,
  subtotal,
  discount,
  serviceFee,
  tip,
  orderTotal,
  total,
  paymentMethod,
  deliveryFee,
  paymentStatus,
}) => {
  const isCard = paymentMethod.toLowerCase().includes("card");
  const cardLast4 = isCard ? paymentMethod.slice(-4) : "";

  return (
    <div className="bg-white rounded p-4 shadow mx-auto" style={{ maxWidth: "480px" }}>
      <div className="text-center">
        <h5 className="fw-bold mb-2">Spicy Chef</h5>
        <p className="text-muted mb-1">Tel: +44 7123 456789</p>
      </div>

      <hr className="my-2 border-dashed" />

      <div className="text-center mb-2">
        <h6 className="fw-semibold">Scheduled for Delivery</h6>
        <p className="text-muted mb-1">
          Requested for <b>{`${format(date, "EEE d-MMM yyyy")} At ${format(new Date(date), "h:mm a")}`}</b>
        </p>
        <p className="text-muted">Order Number: {orderId}</p>
      </div>

      <hr className="my-3 border-dashed" />

      <Table size="sm" bordered>
        <thead>
          <tr>
            <th>Item</th>
            <th className="text-center">Qty</th>
            <th className="text-end">Price (GBP)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ wordBreak: "break-word", maxWidth: 200 }}>{item.name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-end">{item.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="mt-3">
        <div className="d-flex justify-content-between mb-2">
          <strong>Subtotal:</strong>
          <strong>{subtotal}</strong>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <strong>Restaurant Discount:</strong>
          <strong>{discount}</strong>
        </div>

         <div className="d-flex justify-content-between mb-2">
          <strong>Order Total</strong>
          <strong>{orderTotal}</strong>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <strong>Service Charge:</strong>
          <strong>{serviceFee}</strong>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <strong>Delivery Fee</strong>
          <strong>{deliveryFee}</strong>
        </div>

        <hr className="my-2 border-dashed" />

        <div className="d-flex justify-content-between">
          <strong>Total Bill:</strong>
          <strong>{total}</strong>
        </div>
        <div className="d-flex justify-content-between mt-2">
          <span>Total Due:</span>
          <strong>{total}</strong>
        </div>
      </div>

      <hr className="my-2 border-dashed" />

      <div className="mt-3">
        <strong>Paid By:</strong>
        <p className="mb-0">{isCard ? `Card ****${cardLast4}` : paymentMethod}</p>
      </div>

      <hr className="my-3 border-dashed" />

      <div className="text-center">
        <p className="fw-bold mb-1">IMPORTANT: FOR FOOD ALLERGEN INFO</p>
        <p>Call the restaurant or check their menu</p>
      </div>

      <hr className="my-2 border-dashed" />

      <div>
        <p>Customer ID: not provided</p>
        <p>Customer Details:</p>
        <h5>{address}</h5>
      </div>
    </div>
  );
};

export default OrderDetails;

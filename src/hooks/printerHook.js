import { useState } from "react";
import ReceiptWrapper from "../components/printerWrapper";
import { Button, Modal } from "react-bootstrap";

export const useReceiptPrinter = () => {
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const closeModal = () => setShowReceiptModal(false);

 const printReceipt = (order) => {
  try {
    if (!order) return;

    // Calculate subtotal using discounted per-item prices
    const subtotalValue = order.items.reduce((acc, item) => {
      const basePrice = Number(
        item.item?.price ||
          item.variation?.price ||
          item.modifierOption?.price ||
          0
      );
      const quantity = item.quantity || 1;

      // Get discount percentage (if available)
      const discountPercent =
        item.item?.discount || item.variation?.item?.discount || 0;

      const discountedPrice = basePrice - (basePrice * discountPercent) / 100;

      return acc + discountedPrice * quantity;
    }, 0);

    const discountValue = Number(order.discount || 0);
    const serviceFeeValue = Number(order.serviceFee || 0);
    const deliveryFeeValue = Number(order.deliveryFee || 0);

    const orderTotalValue = subtotalValue - discountValue;
    const totalAmountValue =
      orderTotalValue + serviceFeeValue + deliveryFeeValue;

    // Prepare receipt data with both original and discounted price per item
    setReceiptData({
      orderId: order.orderId || order.id,
      address: order.address || "N/A",
      date: order.createdAt || new Date(),
      serviceFee: `£${serviceFeeValue.toFixed(2)}`,
      deliveryFee: `£${deliveryFeeValue.toFixed(2)}`,
      items: order.items.map((item) => {
        const basePrice = Number(
          item.item?.price ||
            item.variation?.price ||
            item.modifierOption?.price ||
            0
        );
        const quantity = item.quantity || 1;
        const discountPercent =
          item.item?.discount || item.variation?.item?.discount || 0;

        const discountedPrice = basePrice - (basePrice * discountPercent) / 100;

        return {
          name:
            item.item?.name ||
            item.variation?.item?.name ||
            item.modifierOption?.name ||
            "Unknown Item",
          quantity,
          // Compact format: Original (Discount%) → Final
          totalAmount:
            discountPercent > 0
              ? `£${basePrice.toFixed(2)}(-${discountPercent}%) → £${(
                  discountedPrice * quantity
                ).toFixed(2)}`
              : `£${(basePrice * quantity).toFixed(2)}`,
        };
      }),
      subtotal: `£${subtotalValue.toFixed(2)}`,
      orderTotal: `£${orderTotalValue.toFixed(2)}`,
      totalAmount: `£${totalAmountValue.toFixed(2)}`,
      discount: discountValue > 0 ? `£${discountValue.toFixed(2)}` : "£0.00",
      tax: `£${Number(order.tax || 0).toFixed(2)}`,
      tip: `£${Number(order.tip || 0).toFixed(2)}`,
      total: `£${Number(order.total || totalAmountValue).toFixed(2)}`,
      paymentMethod: order.paymentType || "Cash",
      paymentStatus: order.paymentStatus || "PAID",
    });

    setShowReceiptModal(true);
  } catch (e) {
    console.log(`Error = `, e);
  }
};

  const ReceiptModal = () =>
    receiptData ? (
      <Modal show={showReceiptModal} onHide={closeModal} centered size="lg">
        <Modal.Body>
          <ReceiptWrapper {...receiptData} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    ) : null;

  return {
    printReceipt,
    ReceiptModal,
  };
};

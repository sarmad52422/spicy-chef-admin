import React, { useState, useEffect } from "react";
import {
  Accordion,
  Button,
  Row,
  Col,
  Badge,
  Spinner,
  Alert,
  Toast,
  ToastContainer,
  Modal,
} from "react-bootstrap";
import { useReceiptPrinter } from "../hooks/printerHook";
import { API_URL } from "../constants/contants";

export default function NewOrders() {
  const [activeTab, setActiveTab] = useState("accepted");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    variant: "success",
  });
  const { printReceipt, ReceiptModal } = useReceiptPrinter();
  const handleMoreActions = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      console.log(`new status = ${newStatus}`);
      const response = await fetch(`${API_URL}/api/order/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      const data = await response.json();

      if (data.status) {
        showAlert("Order status updated successfully!", "success");

        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        showAlert(data.message || "Failed to update order status", "danger");
      }
    } catch (error) {
      showAlert("Error updating order status", "danger");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/order`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.status && Array.isArray(data.result?.data)) {
          setOrders(data.result.data);

          // Save all existing order IDs to localStorage on first load
          const existingOrderIds = data.result.data.map((order) => order.id);
          localStorage.setItem(
            "existingOrderIds",
            JSON.stringify(existingOrderIds)
          );
        } else {
          setOrders([]);
          setError(data.message || "Failed to fetch orders");
        }
      } catch (err) {
        setOrders([]);
        setError("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Helper to show alert with correct variant
  const showAlert = (message, variant = "success") => {
    setAlert({ show: false, message: "", variant: "success" }); // Clear first
    setTimeout(() => {
      setAlert({ show: true, message, variant });
      setTimeout(
        () => setAlert({ show: false, message: "", variant: "success" }),
        3000
      );
    }, 10);
  };

  // Filter orders by status for each tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "pending") return order.status === "PENDING";
    if (activeTab === "accepted") return order.status === "ACCEPTED";
    if (activeTab === "ontheway") return order.status === "ON_THE_WAY";
    if (activeTab === "completed") return order.status === "COMPLETED";
    if (activeTab === "rejected") return order.status === "REJECTED";
    return true;
  });

  const renderOrder = (order, index, showButtons = false, status = null) => (
    <Accordion.Item
      eventKey={index.toString()}
      key={`${status}-${order.id}-${index}`}
    >
      <Accordion.Header>
        <Row className="w-100">
          <Col xs={6}>
            <div>
              <strong>Order #{order.orderId || order.id}</strong>
            </div>
            <div className="text-muted">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : "-"}
            </div>
          </Col>
          <Col
            xs={6}
            className="text-end d-flex align-items-center justify-content-end gap-2"
          >
            <Badge
              bg={
                status === "pending"
                  ? "secondary" // or "info" if you want blue
                  : status === "accepted"
                  ? "success"
                  : status === "ontheway"
                  ? "warning"
                  : status === "completed"
                  ? "primary"
                  : "danger"
              }
              className="px-3 py-2 me-2"
            >
              {status === "pending"
                ? "Pending"
                : status === "accepted"
                ? "Accepted"
                : status === "ontheway"
                ? "On The Way"
                : status === "completed"
                ? "Completed"
                : "Rejected"}
            </Badge>
          </Col>
        </Row>
      </Accordion.Header>

      <Accordion.Body>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          <>
            {order.items.map((item, i) => {
              let itemName = "-";
              let itemPrice = "-";

              if (item.item?.name) {
                itemName = item.item.name;
                itemPrice = item.item.price;
              } else if (item.variation?.item?.name) {
                itemName = item.variation.item.name;
                itemPrice = item.variation.price || item.variation.item.price;
              } else if (item.modifierOption?.name) {
                itemName = item.modifierOption.name;
                itemPrice = item.modifierOption.price;
              }

              return (
                <div
                  key={i}
                  className="mb-2 d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div>
                      <strong>{itemName}</strong>
                    </div>
                  </div>
                  <div>
                    <strong>Qty:</strong> {item.quantity}{" "}
                    {(() => {
                      // Base price
                      const price = Number(
                        item.item?.price ||
                          item.variation?.price ||
                          item.modifierOption?.price ||
                          0
                      );
                      const quantity = item.quantity || 1;

                      const discountPercent =
                        item.item?.discount ||
                        item.variation?.item?.discount ||
                        0;

                      const discountAmountPerUnit =
                        price * (discountPercent / 100);
                      const discountedPrice = price - discountAmountPerUnit;
                      const totalDiscount = discountAmountPerUnit * quantity;
                      const totalFinal = discountedPrice * quantity;

                      return (
                        <div className="ms-3 d-flex flex-column text-end">
                          <div>
                            <strong>Price:</strong> £{price.toFixed(2)}
                          </div>
                          {discountPercent > 0 && (
                            <div className="text-muted small">
                              Discount: -£{totalDiscount.toFixed(2)}
                            </div>
                          )}
                          <div>
                            <strong>Final:</strong> £{totalFinal.toFixed(2)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
            <div className="text-end mt-3 d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={() => printReceipt(order)}
              >
                🧾 Print Receipt
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setShowStatusDialog(true);
                }}
              >
                More Actions
              </button>
            </div>
          </>
        ) : (
          <div>No items</div>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );

  return (
    <div className="container mt-4">
      {/* Full-page loading overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.7)",
            zIndex: 20000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner
            animation="border"
            variant="primary"
            style={{ width: 80, height: 80 }}
          />
        </div>
      )}

      {/* Toasts for alerts at top right */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        <Toast
          show={alert.show}
          onClose={() => setAlert({ ...alert, show: false })}
          bg={
            alert.variant === "success"
              ? "success"
              : alert.variant === "danger"
              ? "danger"
              : "info"
          }
          delay={3000}
          autohide
        >
          <Toast.Body
            className={alert.variant === "success" ? "text-white" : ""}
          >
            {alert.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Orders</h4>
      </div>

      {/* Custom Tab Buttons */}
      <div className="d-flex gap-3 flex-wrap mb-4">
        <button
          className={`btn ${
            activeTab === "pending" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>
        <button
          className={`btn ${
            activeTab === "accepted" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("accepted")}
        >
          Accepted
        </button>
        <button
          className={`btn ${
            activeTab === "ontheway" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("ontheway")}
        >
          On The Way
        </button>
        <button
          className={`btn ${
            activeTab === "completed" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
        <button
          className={`btn ${
            activeTab === "rejected" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected
        </button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Accordion Content Based on Active Tab */}
      <Accordion>
        {filteredOrders.length === 0 && !loading && <div>No orders</div>}
        {filteredOrders.map((order, idx) => {
          return renderOrder(order, idx, false, activeTab);
        })}
      </Accordion>
      <Modal
        show={showStatusDialog}
        onHide={() => setShowStatusDialog(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            if (!selectedOrderId) return null;

            const selectedOrder = orders.find((o) => o.id === selectedOrderId);
            const status = selectedOrder?.status;

            if (status === "ACCEPTED") {
              return (
                <div className="d-flex flex-column gap-2">
                  <Button
                    variant="warning"
                    onClick={() => {
                      handleMoreActions(selectedOrderId, "ON_THE_WAY");
                      setShowStatusDialog(false);
                    }}
                  >
                    Status: On The Way
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => {
                      handleMoreActions(selectedOrderId, "COMPLETED");
                      setShowStatusDialog(false);
                    }}
                  >
                    Status: Delivered
                  </Button>
                </div>
              );
            }
            if (status === "PENDING") {
              return (
                <div className="d-flex flex-column gap-2">
                  <Button
                    variant="success"
                    onClick={() => {
                      handleMoreActions(selectedOrderId, "ACCEPTED");
                      setShowStatusDialog(false);
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleMoreActions(selectedOrderId, "REJECTED");
                      setShowStatusDialog(false);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              );
            }
            if (status === "ON_THE_WAY") {
              return (
                <div className="d-flex flex-column gap-2">
                  <Button
                    variant="success"
                    onClick={() => {
                      handleMoreActions(selectedOrderId, "COMPLETED");
                      setShowStatusDialog(false);
                    }}
                  >
                    Status: Delivered
                  </Button>
                </div>
              );
            }

            // For COMPLETED or REJECTED, show message
            return <p className="text-center mb-0">No actions required.</p>;
          })()}
        </Modal.Body>
      </Modal>

      {ReceiptModal()}
    </div>
  );
}

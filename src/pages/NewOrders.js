import React, { useState, useEffect, useMemo } from "react";
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
  InputGroup,
  Card,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useReceiptPrinter } from "../hooks/printerHook";
import { API_URL } from "../constants/contants";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export default function NewOrders() {
  const [activeTab, setActiveTab] = useState("accepted");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    variant: "success",
  });
  const [selectedOrder, setSelectedOrder] = useState(null); // Track selected order

  // Default to today's range
  const [dateRange, setDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });

  // Temporary range for the picker (applied on Go)
  const [tempDateRange, setTempDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });

  const { printReceipt, ReceiptModal } = useReceiptPrinter();

  // Auto-reset to today at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    const timer = setTimeout(() => {
      setDateRange({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
      });
      setTempDateRange({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
      });
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [dateRange]);

  // Fetch orders
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
        const sorted = data.result.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        console.log(`Sorted at = `, sorted);
        setOrders(sorted);
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const showAlert = (message, variant = "success") => {
    setAlert({ show: false, message: "", variant: "success" });
    setTimeout(() => {
      setAlert({ show: true, message, variant });
      setTimeout(
        () => setAlert({ show: false, message: "", variant: "success" }),
        3000
      );
    }, 10);
  };

  // Apply date range
  const applyDateRange = () => {
    setDateRange({
      start: startOfDay(tempDateRange.start),
      end: endOfDay(tempDateRange.end),
    });
  };

  // Filter orders by status + date
  const filteredOrders = useMemo(() => {
    const filteredByStatus = orders.filter((order) => {
      if (activeTab === "pending") return order.status === "PENDING";
      if (activeTab === "accepted") return order.status === "ACCEPTED";
      if (activeTab === "ontheway") return order.status === "ON_THE_WAY";
      if (activeTab === "completed") return order.status === "COMPLETED";
      if (activeTab === "rejected") return order.status === "REJECTED";
      return true;
    });

    return filteredByStatus.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });
  }, [orders, activeTab, dateRange]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/order/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.status) {
        showAlert("Order status updated successfully!", "success");
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        // Update selected order if it's the one being modified
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        showAlert(data.message || "Failed to update order status", "danger");
      }
    } catch (error) {
      showAlert("Error updating order status", "danger");
    }
  };

  const renderActionButtons = (order) => {
    switch (order.status) {
      case "PENDING":
        return (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleStatusChange(order.id, "ACCEPTED")}
            >
              Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleStatusChange(order.id, "REJECTED")}
            >
              Reject
            </Button>
          </>
        );
      case "ACCEPTED":
        return (
          <>
            <Button
              variant="warning"
              size="sm"
              onClick={() => handleStatusChange(order.id, "ON_THE_WAY")}
            >
              On The Way
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(order.id, "COMPLETED")}
            >
              Complete
            </Button>
          </>
        );
      case "ON_THE_WAY":
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleStatusChange(order.id, "COMPLETED")}
          >
            Mark as Delivered
          </Button>
        );
      default:
        return null;
    }
  };

const renderReceipt = (order) => {
  if (!order) return null;

  return (
    <Card className="h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Order #{order.orderId || order.id}</h5>
        <Badge
          bg={
            order.status === "PENDING"
              ? "secondary"
              : order.status === "ACCEPTED"
              ? "success"
              : order.status === "ON_THE_WAY"
              ? "warning"
              : order.status === "COMPLETED"
              ? "primary"
              : "danger"
          }
          className="px-3 py-2"
        >
          {order.status === "PENDING"
            ? "Pending"
            : order.status === "ACCEPTED"
            ? "Accepted"
            : order.status === "ON_THE_WAY"
            ? "On The Way"
            : order.status === "COMPLETED"
            ? "Completed"
            : "Rejected"}
        </Badge>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <small className="text-muted">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "-"}
          </small>
        </div>
        
        {Array.isArray(order.items) && order.items.length > 0 ? (
          <>
            <div className="mb-4">
              <div className="d-flex justify-content-between fw-bold mb-2 pb-2 border-bottom">
                <div className="col-6">Item</div>
                <div className="col-2 text-center">Qty</div>
                <div className="col-2 text-end">Price</div>
                <div className="col-2 text-end">Total</div>
              </div>
              
              {order.items.map((item, i) => {
                let itemName = "-";
                let price = 0;

                if (item.item?.name) {
                  itemName = item.item.name;
                  price = item.item.price;
                } else if (item.variation?.item?.name) {
                  itemName = item.variation.item.name;
                  price = item.variation.price || item.variation.item.price;
                } else if (item.modifierOption?.name) {
                  itemName = item.modifierOption.name;
                  price = item.modifierOption.price;
                }

                const quantity = item.quantity || 1;
                const discountPercent =
                  item.item?.discount || item.variation?.item?.discount || 0;
                const discountAmountPerUnit = price * (discountPercent / 100);
                const discountedPrice = price - discountAmountPerUnit;
                const totalFinal = discountedPrice * quantity;

                return (
                  <React.Fragment key={i}>
                    <div className="d-flex justify-content-between align-items-center py-2">
                      <div className="col-6">
                        <strong>{itemName}</strong>
                        {discountPercent > 0 && (
                          <div className="text-success small">
                            {discountPercent}% off
                          </div>
                        )}
                      </div>
                      <div className="col-2 text-center">{quantity}</div>
                      <div className="col-2 text-end">£{price}</div>
                      <div className="col-2 text-end fw-bold">
                        £{totalFinal.toFixed(2)}
                      </div>
                    </div>
                    {i < order.items.length - 1 && <hr className="my-1" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between">
                <span>Subtotal:</span>
                <span>£{order.subTotal || "0.00"}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="d-flex justify-content-between">
                  <span>Delivery Fee:</span>
                  <span>£{order.deliveryFee|| "0.00"}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="d-flex justify-content-between text-success">
                  <span>Discount:</span>
                  <span>-£{order.discountAmount || "0.00"}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold mt-2">
                <span>Total:</span>
                <span>£{order.totalAmount || "0.00"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => printReceipt(order)}
              >
                🧾 Print Receipt
              </Button>
              {renderActionButtons(order)}
            </div>
          </>
        ) : (
          <div>No items in this order</div>
        )}
      </Card.Body>
    </Card>
  );
};

  const renderOrder = (order, index, status = null) => (
    <Accordion.Item
      eventKey={index.toString()}
      key={`${status}-${order.id}-${index}`}
      onClick={() => setSelectedOrder(order)}
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
                  ? "secondary"
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
    </Accordion.Item>
  );

  return (
    <div className="container-fluid mt-4">
      {/* Loader overlay */}
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

      {/* Toast messages */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        <Toast
          show={alert.show}
          onClose={() => setAlert({ ...alert, show: false })}
          bg={alert.variant}
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

      <Row>
        {/* Left column - Orders list */}
        <Col md={selectedOrder ? 6 : 12}>
          {/* Header with calendar */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Orders</h4>
            <InputGroup className="w-auto d-flex align-items-center gap-2">
              <DatePicker
                selected={tempDateRange.start}
                onChange={(date) =>
                  setTempDateRange((prev) => ({ ...prev, start: date }))
                }
                selectsStart
                startDate={tempDateRange.start}
                endDate={tempDateRange.end}
                dateFormat="yyyy-MM-dd"
                className="form-control"
              />
              <span>to</span>
              <DatePicker
                selected={tempDateRange.end}
                onChange={(date) =>
                  setTempDateRange((prev) => ({ ...prev, end: date }))
                }
                selectsEnd
                startDate={tempDateRange.start}
                endDate={tempDateRange.end}
                minDate={tempDateRange.start}
                dateFormat="yyyy-MM-dd"
                className="form-control"
              />
              <Button variant="primary" onClick={applyDateRange}>
                Go
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  const todayStart = startOfDay(new Date());
                  const todayEnd = endOfDay(new Date());
                  setTempDateRange({ start: todayStart, end: todayEnd });
                  setDateRange({ start: todayStart, end: todayEnd });
                }}
              >
                Clear
              </Button>
            </InputGroup>
          </div>

          {/* Tabs for status */}
          <div className="d-flex gap-3 flex-wrap mb-4">
            {["pending", "accepted", "ontheway", "completed", "rejected"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`btn ${
                    activeTab === tab ? "btn-dark" : "btn-outline-dark"
                  } rounded-pill px-4 shadow-sm`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Orders accordion */}
          {error && <Alert variant="danger">{error}</Alert>}
          <Accordion>
            {filteredOrders.length === 0 && !loading && <div>No orders</div>}
            {filteredOrders.map((order, idx) =>
              renderOrder(order, idx, activeTab)
            )}
          </Accordion>
        </Col>

        {/* Right column - Receipt */}
        {selectedOrder && (
      <Col md={6} className="mt-md-0 mt-4">
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h4 className="mb-0">Order Details</h4>
    <button
      className="btn-close"
      onClick={()=>setSelectedOrder(null)}
      aria-label="Close"
      
    ></button>
  </div>
  {renderReceipt(selectedOrder)}
</Col>

        )}
      </Row>

      {ReceiptModal()}
    </div>
  );
}
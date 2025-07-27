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

  const renderOrder = (order, index, status = null) => (
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

      <Accordion.Body>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          <>
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
              const totalDiscount = discountAmountPerUnit * quantity;
              const totalFinal = discountedPrice * quantity;

              return (
                <div
                  key={i}
                  className="mb-2 d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{itemName}</strong>
                  </div>
                  <div>
                    <strong>Qty:</strong> {quantity}
                    <div className="ms-3 d-flex flex-column text-end">
                      <div>
                        <strong>Price:</strong> £{price}
                      </div>
                      {discountPercent > 0 && (
                        <div className="text-muted small">
                          Discount: -£{totalDiscount?.toFixed(2)}
                        </div>
                      )}
                      <div>
                        <strong>Final:</strong> £{totalFinal?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="text-end mt-3 d-flex justify-content-end gap-2">
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
          <div>No items</div>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );

  return (
    <div className="container mt-4">
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
        {filteredOrders.map((order, idx) => renderOrder(order, idx, activeTab))}
      </Accordion>

      {ReceiptModal()}
    </div>
  );
}

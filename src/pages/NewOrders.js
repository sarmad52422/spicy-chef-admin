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
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [htmlData, setHtmlData] = useState(undefined);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    variant: "success",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [dateRange, setDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });
  const [tempDateRange, setTempDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });

  const { prepareReceipt, handleQZPrint } = useReceiptPrinter();

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
  }, []);

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
        setOrders(sorted);
        console.log(sorted[0]);
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

  const applyDateRange = () => {
    setDateRange({
      start: startOfDay(tempDateRange.start),
      end: endOfDay(tempDateRange.end),
    });
  };

  // Calculate accurate order totals
  const calculateOrderTotals = (order) => {
    let calculatedSubtotal = 0;

    if (Array.isArray(order.items) && order.items.length > 0) {
      calculatedSubtotal = order.items.reduce((sum, item) => {
        let price = 0;
        if (item.item?.price) {
          price = item.item.price;
        } else if (item.variation?.price) {
          price = item.variation.price;
        } else if (item.variation?.item?.price) {
          price = item.variation.item.price;
        } else if (item.modifierOption?.price) {
          price = item.modifierOption.price;
        }

        const quantity = item.quantity || 1;
        const discountPercent =
          item.item?.discount || item.variation?.item?.discount || 0;
        const discountedPrice = price - price * (discountPercent / 100);

        return sum + discountedPrice * quantity;
      }, 0);
    }

    const subtotal =
      calculatedSubtotal > 0
        ? calculatedSubtotal
        : parseFloat(order.subTotal || 0);
    const serviceFee = parseFloat(order.serviceFee || 0);
    const deliveryFee = parseFloat(order.deliveryFee || 0);
    const discountAmount = parseFloat(order.discountAmount || 0);
    const total = parseFloat(order.totalAmount || 0);

    return { subtotal, serviceFee, deliveryFee, discountAmount, total };
  };

  // Filter orders by tab and date
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (activeTab === "pending")
          return order.status === "PENDING" || order.status === "NEW";
        if (activeTab === "accepted") return order.status === "ACCEPTED";
        if (activeTab === "ontheway") return order.status === "ON_THE_WAY";
        if (activeTab === "completed") return order.status === "COMPLETED";
        if (activeTab === "rejected") return order.status === "REJECTED";
        return true;
      })
      .filter((order) => {
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
        if (selectedOrder && selectedOrder.id === orderId)
          setSelectedOrder({ ...selectedOrder, status: newStatus });
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
      case "NEW":
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
              className="ms-2"
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
              className="ms-2"
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

    const { subtotal, serviceFee, deliveryFee, discountAmount, total } =
      calculateOrderTotals(order);

    return (
      <Card className="h-100 shadow-sm">
        {/* Header with Order ID + Status */}
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary bg-gradient text-white">
          <h5 className="mb-0 fw-bold">Order #{order.orderId || order.id}</h5>
          <Badge
            bg={
              order.status === "NEW"
                ? "info"
                : order.status === "PENDING"
                ? "secondary"
                : order.status === "ACCEPTED"
                ? "success"
                : order.status === "ON_THE_WAY"
                ? "warning"
                : order.status === "COMPLETED"
                ? "dark"
                : "danger"
            }
            className="px-3 py-2"
          >
            {order.status === "NEW"
              ? "NEW"
              : order.status === "PENDING"
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
          {/* Order Date */}
          <div className="mb-3 pb-3 border-bottom">
            <small className="text-muted fw-medium">
              <i className="bi bi-calendar-event me-2"></i>
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : "-"}
            </small>
          </div>

          {/* Customer Info */}
          <div className="mb-4 p-3 bg-light rounded">
            <h6 className="fw-bold mb-3 text-primary">
              <i className="bi bi-person-circle me-2"></i>
              Customer Information
            </h6>
            <Row className="g-2">
              <Col xs={12}>
                <strong>Name:</strong> {order.fullName || "-"}
              </Col>
              <Col xs={12}>
                <strong>Email:</strong> {order.email || "-"}
              </Col>
              <Col xs={12}>
                <strong>Phone:</strong> {order.phoneNo || "-"}
              </Col>
              <Col xs={12}>
                <strong>Address:</strong> {order.address || "-"}
              </Col>
              {order.postCode && (
                <Col xs={12}>
                  <strong>Postcode:</strong> {order.postCode}
                </Col>
              )}
            </Row>
          </div>

          {/* Items List */}
          {Array.isArray(order.items) && order.items.length > 0 ? (
            <>
              <div className="mb-4">
                <h6 className="fw-bold mb-3 text-primary">
                  <i className="bi bi-bag-check me-2"></i>
                  Order Items
                </h6>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th className="text-center" style={{ width: "80px" }}>
                          Qty
                        </th>
                        <th className="text-end" style={{ width: "100px" }}>
                          Price
                        </th>
                        <th className="text-end" style={{ width: "100px" }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => {
                        let itemName = "-";
                        let price = 0;
                        if (item.item?.name) {
                          itemName = item.item.name;
                          price = item.item.price;
                        } else if (item.variation?.item?.name) {
                          itemName = item.variation.item.name;
                          price =
                            item.variation.price || item.variation.item.price;
                        } else if (item.modifierOption?.name) {
                          itemName = item.modifierOption.name;
                          price = item.modifierOption.price;
                        }

                        const quantity = item.quantity || 1;
                        const discountPercent =
                          item.item?.discount ||
                          item.variation?.item?.discount ||
                          0;
                        const discountedPrice =
                          price - price * (discountPercent / 100);
                        const totalFinal = discountedPrice * quantity;

                        return (
                          <tr key={i}>
                            <td>
                              <div>
                                <strong>{itemName}</strong>
                                {discountPercent > 0 && (
                                  <div className="text-success small fw-medium">
                                    <i className="bi bi-tag-fill me-1"></i>
                                    {discountPercent}% off
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <Badge bg="secondary" pill>
                                {quantity}
                              </Badge>
                            </td>
                            <td className="text-end">£{price}</td>
                            <td className="text-end fw-bold">
                              £{totalFinal?.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary - Improved */}
              <div className="border-top pt-4">
                <h6 className="fw-bold mb-3 text-primary">
                  <i className="bi bi-calculator me-2"></i>
                  Order Summary
                </h6>

                <div className="bg-light rounded p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal:</span>
                    <span className="fw-semibold">£{subtotal?.toFixed(2)}</span>
                  </div>

                  {serviceFee > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Service Fee:</span>
                      <span className="fw-semibold">
                        £{serviceFee?.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {deliveryFee > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Delivery Fee:</span>
                      <span className="fw-semibold">
                        £{deliveryFee?.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-success">
                        <i className="bi bi-tag-fill me-1"></i>
                        Discount:
                      </span>
                      <span className="fw-semibold text-success">
                        -£{discountAmount?.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <hr className="my-2" />
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Discount:</span>
                    <span className="fw-semibold">-£{order.discount}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-5 fw-bold">Total Amount:</span>
                    <span className="fs-4 fw-bold text-primary">
                      £{total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    const data = prepareReceipt(order);
                    setHtmlData(data);
                    setTimeout(() => handleQZPrint(data), 1000);
                  }}
                >
                  <i className="bi bi-printer me-1"></i>
                  Print Receipt
                </Button>
                {renderActionButtons(order)}
              </div>
            </>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="bi bi-info-circle me-2"></i>
              No items in this order
            </Alert>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderOrder = (order, index) => (
    <Accordion.Item
      eventKey={index.toString()}
      key={order.id}
      onClick={() => setSelectedOrder(order)}
      className="mb-2 border rounded"
    >
      <Accordion.Header>
        <Row className="w-100">
          <Col xs={6}>
            <strong className="text-primary">
              Order #{order.orderId || order.id}
            </strong>
            <div className="text-muted small">
              <i className="bi bi-clock me-1"></i>
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
                order.status === "NEW"
                  ? "info"
                  : order.status === "PENDING"
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
              {order.status === "NEW"
                ? "NEW"
                : order.status === "PENDING"
                ? "Pending"
                : order.status === "ACCEPTED"
                ? "Accepted"
                : order.status === "ON_THE_WAY"
                ? "On The Way"
                : order.status === "COMPLETED"
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
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 20000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="text-center">
            <Spinner
              animation="border"
              variant="primary"
              style={{ width: 80, height: 80 }}
            />
            <p className="mt-3 text-primary fw-bold">Loading orders...</p>
          </div>
        </div>
      )}

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
        <Col md={selectedOrder ? 6 : 12}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0 fw-bold">
              <i className="bi bi-receipt-cutoff me-2 text-primary"></i>
              Orders Management
            </h4>
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
              <span className="text-muted">to</span>
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

          <div className="d-flex gap-2 flex-wrap mb-4">
            {["pending", "accepted", "ontheway", "completed", "rejected"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`btn ${
                    activeTab === tab ? "btn-primary" : "btn-outline-primary"
                  } rounded-pill px-4 shadow-sm`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() +
                    tab.slice(1).replace("ontheway", "On The Way")}
                  <Badge
                    bg={activeTab === tab ? "light" : "primary"}
                    text={activeTab === tab ? "primary" : "light"}
                    className="ms-2"
                  >
                    {
                      orders.filter((o) => {
                        if (tab === "pending")
                          return o.status === "PENDING" || o.status === "NEW";
                        if (tab === "accepted") return o.status === "ACCEPTED";
                        if (tab === "ontheway")
                          return o.status === "ON_THE_WAY";
                        if (tab === "completed")
                          return o.status === "COMPLETED";
                        if (tab === "rejected") return o.status === "REJECTED";
                        return false;
                      }).length
                    }
                  </Badge>
                </button>
              )
            )}
          </div>

          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </Alert>
          )}

          <Accordion>
            {filteredOrders.length === 0 && !loading && (
              <Alert variant="info" className="text-center">
                <i className="bi bi-inbox me-2"></i>
                No orders found for the selected criteria
              </Alert>
            )}
            {filteredOrders.map((order, idx) => renderOrder(order, idx))}
          </Accordion>
        </Col>

        {selectedOrder && (
          <Col md={6} className="mt-md-0 mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 fw-bold">
                <i className="bi bi-file-text me-2 text-primary"></i>
                Order Details
              </h4>
              <button
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
              ></button>
            </div>
            {renderReceipt(selectedOrder)}
          </Col>
        )}
      </Row>
    </div>
  );
}

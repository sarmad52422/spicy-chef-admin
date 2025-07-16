import React, { useState, useEffect } from "react";
import { Accordion, Button, Row, Col, Badge, Spinner, Alert, Toast, ToastContainer } from "react-bootstrap";

export default function NewOrders() {
  const [activeTab, setActiveTab] = useState("new");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusLoading, setStatusLoading] = useState({}); // { [orderId]: 'accept' | 'reject' | null }
  const [statusError, setStatusError] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://api.eatmeonline.co.uk/api/order", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.status && Array.isArray(data.result?.data)) {
          setOrders(data.result.data);

          // Save all existing order IDs to localStorage on first load
          const existingOrderIds = data.result.data.map(order => order.id);
          localStorage.setItem('existingOrderIds', JSON.stringify(existingOrderIds));
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
  const showAlert = (message, variant = 'success') => {
    setAlert({ show: false, message: '', variant: 'success' }); // Clear first
    setTimeout(() => {
      setAlert({ show: true, message, variant });
      setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
    }, 10);
  };

  const updateOrderStatus = async (orderId, status, buttonType) => {
    setStatusLoading(prev => ({ ...prev, [orderId]: buttonType }));
    setStatusError(prev => ({ ...prev, [orderId]: null }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://api.eatmeonline.co.uk/api/order/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      showAlert(`Order ${status.toLowerCase()} successfully!`, 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      setStatusError(prev => ({ ...prev, [orderId]: "Failed to update status" }));
      showAlert('Failed to update status', 'danger');
    }
    setStatusLoading(prev => ({ ...prev, [orderId]: null }));
  };

  // Filter orders by status for each tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "new") return order.status === "PENDING" && order.paymentStatus === "PENDING";
    if (activeTab === "accepted") return order.status === "ACCEPTED" || order.paymentStatus === "ACCEPTED";
    if (activeTab === "rejected") return order.status === "REJECTED" || order.paymentStatus === "REJECTED";
    return true;
  });

  const renderOrder = (order, index, showButtons = true, status = null) => (
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
            <div className="text-muted">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</div>
          </Col>
          <Col
            xs={6}
            className="text-end d-flex align-items-center justify-content-end gap-2"
          >
            {showButtons ? (
              <>
                <Button
                  variant="outline-success me-2"
                  size="sm"
                  disabled={statusLoading[order.id] === 'accept'}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateOrderStatus(order.id, "ACCEPTED", 'accept');
                  }}
                >
                  {statusLoading[order.id] === 'accept' ? <Spinner size="sm" animation="border" className="" /> : "Accept"}
                </Button>
                <Button
                  variant="outline-danger me-2"
                  size="sm"
                  disabled={statusLoading[order.id] === 'reject'}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateOrderStatus(order.id, "REJECTED", 'reject');
                  }}
                >
                  {statusLoading[order.id] === 'reject' ? <Spinner size="sm" animation="border" /> : "Reject"}
                </Button>
                {statusError[order.id] && <div className="text-danger small">{statusError[order.id]}</div>}
              </>
            ) : (
              <Badge
                bg={status === "accepted" ? "success" : "danger"}
                className="px-3 py-2 me-2"
              >
                {status === "accepted" ? "Accepted" : "Rejected"}
              </Badge>
            )}
          </Col>
        </Row>
      </Accordion.Header>
      <Accordion.Body>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          order.items.map((item, i) => {
            // Get item name and price
            let itemName = "-";
            let itemPrice = "-";
            if (item.item && item.item.name) {
              itemName = item.item.name;
              itemPrice = item.item.price;
            } else if (item.variation && item.variation.item && item.variation.item.name) {
              itemName = item.variation.item.name;
              itemPrice = item.variation.price || item.variation.item.price;
            } else if (item.modifierOption && item.modifierOption.name) {
              itemName = item.modifierOption.name;
              itemPrice = item.modifierOption.price;
            }
            return (
              <div key={i} className="mb-2 d-flex justify-content-between align-items-center">
                <div>
                  <div>
                    <strong>{itemName}</strong>
                  </div>
                </div>
                <div>
                  <strong>Qty:</strong> {item.quantity} <span className="ms-3"><strong>Price:</strong> £{itemPrice}</span>
                </div>
              </div>
            );
          })
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Spinner animation="border" variant="primary" style={{ width: 80, height: 80 }} />
        </div>
      )}
      
      {/* Toasts for alerts at top right */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          show={alert.show}
          onClose={() => setAlert({ ...alert, show: false })}
          bg={alert.variant === 'success' ? 'success' : alert.variant === 'danger' ? 'danger' : 'info'}
          delay={3000}
          autohide
        >
          <Toast.Body className={alert.variant === 'success' ? 'text-white' : ''}>
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
          className={`btn ${activeTab === "new" ? "btn-dark" : "btn-outline-dark"
            } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("new")}
        >
          New Orders
        </button>
        <button
          className={`btn ${activeTab === "accepted" ? "btn-dark" : "btn-outline-dark"
            } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("accepted")}
        >
          Accepted
        </button>
        <button
          className={`btn ${activeTab === "rejected" ? "btn-dark" : "btn-outline-dark"
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
        {filteredOrders.map((order, idx) =>
          renderOrder(order, idx, activeTab === "new", activeTab)
        )}
      </Accordion>
    </div>
  );
}

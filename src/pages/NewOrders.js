import React, { useState, useEffect, useRef } from "react";
import { Accordion, Button, Row, Col, Badge, Spinner, Alert, Modal, Toast, ToastContainer } from "react-bootstrap";
import { FaBell } from "react-icons/fa";

const NOTIFICATION_SOUND_URL = "/sound/notification.mp3";

export default function NewOrders() {
  const [activeTab, setActiveTab] = useState("new");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusLoading, setStatusLoading] = useState({}); // { [orderId]: 'accept' | 'reject' | null }
  const [statusError, setStatusError] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  
  // New order modal states
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [currentNewOrder, setCurrentNewOrder] = useState(null);
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);
  const [orderStatusError, setOrderStatusError] = useState("");

  // Notification states
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const audioRef = useRef(null);

  // Prime audio on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        });
      }
      window.removeEventListener('click', handleUserInteraction);
    };
    window.addEventListener('click', handleUserInteraction);
    return () => window.removeEventListener('click', handleUserInteraction);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.load();
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  // Update pending order count
  const updatePendingCount = (orders) => {
    const pending = orders.filter(order => 
      order.status === "PENDING" || order.paymentStatus === "PENDING"
    ).length;
    setPendingOrderCount(pending);
  };

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
          updatePendingCount(data.result.data);
          
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

  // Check for new orders and show modal
  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://api.eatmeonline.co.uk/api/order", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log("Order API response:", data);
        
        if (data.status && Array.isArray(data.result?.data)) {
          // Get existing order IDs from localStorage
          const existingOrderIds = JSON.parse(localStorage.getItem('existingOrderIds') || '[]');
          const currentOrderIds = data.result.data.map(order => order.id);
          
          console.log("Existing order IDs:", existingOrderIds);
          console.log("Current order IDs:", currentOrderIds);
          
          // Find any new order that doesn't exist in localStorage
          const newOrder = data.result.data.find(
            (order) => !existingOrderIds.includes(order.id)
          );
          
          console.log("New order found:", newOrder);
          
          if (newOrder) {
            console.log("Found new order:", newOrder);
            setCurrentNewOrder(newOrder);
            setNewOrderModal(true);
            setHasNewNotifications(true);
            playNotificationSound();
            
            // Add this order to localStorage
            const updatedOrderIds = [...existingOrderIds, newOrder.id];
            localStorage.setItem('existingOrderIds', JSON.stringify(updatedOrderIds));
            console.log("Updated localStorage with:", updatedOrderIds);
          }
          
          // Update pending count
          updatePendingCount(data.result.data);
        }
      } catch (err) {
        console.error("Error checking new orders:", err);
      }
    };

    // Initial check
    checkNewOrders();

    // Set up polling every 5 seconds (reduced for faster testing)
    const interval = setInterval(checkNewOrders, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
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
      if (data.status) {
        showAlert(`Order ${status === 'ACCEPTED' ? 'accepted' : 'rejected'} successfully!`, 'success');
        // Refresh orders
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
              updatePendingCount(data.result.data);
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
        await fetchOrders();
      } else {
        setStatusError(prev => ({ ...prev, [orderId]: data.message || "Failed to update status" }));
        showAlert(data.message || 'Failed to update status', 'danger');
      }
    } catch (err) {
      setStatusError(prev => ({ ...prev, [orderId]: "Failed to update status" }));
      showAlert('Failed to update status', 'danger');
    }
    setStatusLoading(prev => ({ ...prev, [orderId]: null }));
  };

  const handleNewOrderAction = async (orderId, status) => {
    setOrderStatusLoading(true);
    setOrderStatusError("");
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
      if (data.status) {
        setNewOrderModal(false);
        setCurrentNewOrder(null);
        setHasNewNotifications(false);
        showAlert(`Order ${status === 'ACCEPTED' ? 'accepted' : 'rejected'} successfully!`, 'success');
        
        // Refresh orders to update count
        const fetchOrders = async () => {
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
              updatePendingCount(data.result.data);
            }
          } catch (err) {
            console.error("Error refreshing orders:", err);
          }
        };
        await fetchOrders();
      } else {
        setOrderStatusError(data.message || "Failed to update order status");
        showAlert(data.message || 'Failed to update status', 'danger');
      }
    } catch (err) {
      setOrderStatusError("Failed to update order status");
      showAlert('Failed to update status', 'danger');
    }
    setOrderStatusLoading(false);
  };

  // Function to clear localStorage (for testing purposes)
  const clearOrderHistory = () => {
    localStorage.removeItem('existingOrderIds');
    showAlert('Order history cleared!', 'info');
  };

  // Function to manually check for new orders (for testing)
  const manualCheckNewOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://api.eatmeonline.co.uk/api/order", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log("Manual check - Order API response:", data);
      
      if (data.status && Array.isArray(data.result?.data)) {
        const existingOrderIds = JSON.parse(localStorage.getItem('existingOrderIds') || '[]');
        const currentOrderIds = data.result.data.map(order => order.id);
        
        console.log("Manual check - Existing order IDs:", existingOrderIds);
        console.log("Manual check - Current order IDs:", currentOrderIds);
        
        const newOrder = data.result.data.find(
          (order) => !existingOrderIds.includes(order.id)
        );
        
        console.log("Manual check - New order found:", newOrder);
        
        if (newOrder) {
          setCurrentNewOrder(newOrder);
          setNewOrderModal(true);
          setHasNewNotifications(true);
          playNotificationSound();
          const updatedOrderIds = [...existingOrderIds, newOrder.id];
          localStorage.setItem('existingOrderIds', JSON.stringify(updatedOrderIds));
          showAlert('New order found and modal shown!', 'success');
        } else {
          showAlert('No new orders found', 'info');
        }
      }
    } catch (err) {
      console.error("Error in manual check:", err);
      showAlert('Error checking for new orders', 'danger');
    }
  };

  // Filter orders by status for each tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "new") return order.status === "PENDING" || order.paymentStatus === "PENDING";
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
      
      {/* Bell Notification Icon */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 10000 }}>
        <div className="position-relative">
          <FaBell 
            size={24} 
            className={`cursor-pointer ${hasNewNotifications ? 'text-danger' : 'text-dark'}`}
            style={{ 
              animation: hasNewNotifications ? 'shake 0.5s infinite' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (hasNewNotifications) {
                setHasNewNotifications(false);
                showAlert('Notifications cleared!', 'info');
              }
            }}
          />
          {pendingOrderCount > 0 && (
            <Badge 
              bg="danger" 
              className="position-absolute top-0 start-100 translate-middle rounded-pill"
              style={{ fontSize: '0.7rem', minWidth: '18px' }}
            >
              {pendingOrderCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Orders</h4>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary btn-sm" 
            onClick={manualCheckNewOrders}
            title="Manually check for new orders"
          >
            Check New Orders
          </button>
          <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={clearOrderHistory}
            title="Clear order history to test new order detection"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Custom Tab Buttons */}
      <div className="d-flex gap-3 flex-wrap mb-4">
        <button
          className={`btn ${
            activeTab === "new" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("new")}
        >
          New Orders
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
            activeTab === "rejected" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected
        </button>
      </div>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Accordion Content Based on Active Tab */}
      <Accordion>
        {filteredOrders.length === 0 && !loading && <div>No orders</div>}
        {filteredOrders.map((order, idx) =>
          renderOrder(order, idx, activeTab === "new", activeTab)
        )}
      </Accordion>

      {/* New Order Modal */}
      <Modal show={newOrderModal} onHide={() => setNewOrderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Order Received</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentNewOrder ? (
            <>
              <div><strong>Order #{currentNewOrder.orderId || currentNewOrder.id}</strong></div>
              <div className="text-muted mb-2">{currentNewOrder.createdAt ? new Date(currentNewOrder.createdAt).toLocaleString() : "-"}</div>
              {Array.isArray(currentNewOrder.items) && currentNewOrder.items.length > 0 ? (
                currentNewOrder.items.map((item, i) => {
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
                      <div><strong>{itemName}</strong></div>
                      <div><strong>Qty:</strong> {item.quantity} <span className="ms-3"><strong>Price:</strong> £{itemPrice}</span></div>
                    </div>
                  );
                })
              ) : (
                <div>No items</div>
              )}
              {orderStatusError && <Alert variant="danger" className="mt-2">{orderStatusError}</Alert>}
            </>
          ) : (
            <div>No order details</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={() => handleNewOrderAction(currentNewOrder.id, "ACCEPTED")}
            disabled={orderStatusLoading}>
            {orderStatusLoading ? <Spinner size="sm" animation="border" /> : "Accept"}
          </Button>
          <Button variant="danger" onClick={() => handleNewOrderAction(currentNewOrder.id, "REJECTED")}
            disabled={orderStatusLoading}>
            {orderStatusLoading ? <Spinner size="sm" animation="border" /> : "Reject"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS for bell shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}

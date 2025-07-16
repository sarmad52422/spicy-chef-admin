// src/App.js
import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Modal, Button, Spinner, Alert, Badge, Toast, ToastContainer } from "react-bootstrap";
import { FaBell } from "react-icons/fa";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LiveOrder from "./pages/LiveOrder";
import PendingPayments from "./pages/PendingPayments";
import Modifier from "./pages/Modifier";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import { useDispatch } from "react-redux";
import { initializeMenu } from "./redux/slices/menuSlice";
import Login from "./pages/Login";
import Setting from "./pages/Setting";
import NewOrders from "./pages/NewOrders";
import AuthWatcher from "./AuthWatcher";

const NOTIFICATION_SOUND_URL = "/sound/notification.mp3";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function GlobalNotifications() {
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [currentNewOrder, setCurrentNewOrder] = useState(null);
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);
  const [orderStatusLoadingReject, setOrderStatusLoadingReject] = useState(false);
  const [orderStatusError, setOrderStatusError] = useState("");
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const audioRef = useRef(null);
  const location = useLocation();

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
    // Initialize audio with better error handling
    const initAudio = () => {
      try {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.preload = 'auto';
        audioRef.current.volume = 1.0;
        
        // Add event listeners for audio events
        audioRef.current.addEventListener('canplaythrough', () => {
          console.log('Audio loaded and ready to play');
        });
        
        audioRef.current.addEventListener('error', (e) => {
          console.error('Audio loading error:', e);
        });
        
        audioRef.current.load();
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };
    
    initAudio();
  }, []);

  const playNotificationSound = () => {
    console.log('Attempting to play notification sound');
    
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.loop = true;
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio started playing successfully');
            })
            .catch(error => {
              console.error('Audio play failed:', error);
              // Try alternative approach for browsers with autoplay restrictions
              document.addEventListener('click', () => {
                audioRef.current.play().catch(e => console.log('Retry play failed:', e));
              }, { once: true });
            });
        }
      } catch (error) {
        console.error('Error in playNotificationSound:', error);
      }
    } else {
      console.error('Audio element not initialized');
    }
  };

  const stopNotificationSound = () => {
    console.log('Stopping notification sound');
    
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.loop = false;
        console.log('Audio stopped successfully');
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  };

  // Update pending order count
  const updatePendingCount = (orders) => {
    const pending = orders.filter(order =>
      order.status === "PENDING" || order.paymentStatus === "PENDING"
    ).length;
    setPendingOrderCount(pending);
  };

  // Helper to show alert with correct variant
  const showAlert = (message, variant = 'success') => {
    setAlert({ show: false, message: '', variant: 'success' }); // Clear first
    setTimeout(() => {
      setAlert({ show: true, message, variant });
      setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
    }, 10);
  };

  // Check for new orders and show modal
  useEffect(() => {
    // Only run notifications if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) return;

    const checkNewOrders = async () => {
      try {
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
            console.log("Auto check - Playing sound for new order");
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

    // Set up polling every 5 seconds
    const interval = setInterval(checkNewOrders, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const handleNewOrderAction = async (orderId, status) => {
    // Stop sound immediately when button is clicked
    stopNotificationSound();
    setOrderStatusError("");

    if (status === "ACCEPTED") {
      setOrderStatusLoading(true);
    } else {
      setOrderStatusLoadingReject(true);
    }

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

      setOrderStatusError(`✅ Order ${status.toLowerCase()} successfully!`);

      // Close modal after showing success message
      setTimeout(() => {
        setNewOrderModal(false);
        setCurrentNewOrder(null);
        setOrderStatusError("");
        setOrderStatusLoading(false);
        setOrderStatusLoadingReject(false);
        // Trigger refresh only on NewOrders page
        if (location.pathname === '/new-orders') {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }, 1000);
    } catch (err) {
      setOrderStatusError('Failed to update status');
    } finally {
      setOrderStatusLoading(false);
      setOrderStatusLoadingReject(false);
    }
  };

  // Only show notifications if user is authenticated
  const token = localStorage.getItem("token");
  if (!token) return null;

  return (
    <>
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

      {/* Global Bell Notification Icon */}
      <div className="bell-icon-global" style={{ position: 'fixed', top: '20px', right: '400px', zIndex: 1000 }}>
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

      {/* Global New Order Modal */}
      <Modal
        show={newOrderModal}
        onHide={() => { }} // Prevent closing
        centered
        backdrop="static" // Prevent closing on backdrop click
        keyboard={false} // Prevent closing with ESC key
        className="urgent-modal"
        onClick={(e) => {
          // Prevent modal clicks from interfering with audio
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Modal.Header className={orderStatusError && orderStatusError.includes('✅') ? "bg-success text-white" : "bg-warning text-dark"}>
          <Modal.Title>
            {orderStatusError && orderStatusError.includes('✅')
              ? "✅ Order Processing Complete"
              : "⚠️ New Order Received - Action Required"
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body onClick={(e) => {
          // Prevent any click events from interfering with audio
          e.preventDefault();
          e.stopPropagation();
        }}>
          {currentNewOrder ? (
            <>
              <div className="alert alert-warning mb-3" role="alert">
                <strong>🔔 Action Required!</strong> You must accept or reject this order. The modal cannot be closed until you take action.
              </div>
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
              {orderStatusError && (
                <Alert
                  variant="success"
                  className={`mt-2 ${orderStatusError.includes('✅') ? 'text-center fw-bold' : ''}`}
                  style={orderStatusError.includes('✅') ? { fontSize: '1.1rem' } : {}}
                >
                  {orderStatusError}
                </Alert>
              )}
            </>
          ) : (
            <div>No order details</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={(e) => {
              e.stopPropagation();
              handleNewOrderAction(currentNewOrder.id, "ACCEPTED");
            }}
            disabled={orderStatusLoading}
          >
            {orderStatusLoading ? <Spinner size="sm" animation="border" /> : "Accept"}
          </Button>
          <Button
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              handleNewOrderAction(currentNewOrder.id, "REJECTED");
            }}
            disabled={orderStatusLoadingReject}
          >
            {orderStatusLoadingReject ? <Spinner size="sm" animation="border" /> : "Reject"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS for bell shake animation and modal pulse */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        :global(.urgent-modal .modal-dialog) {
          animation: pulse 2s infinite;
        }
        :global(.urgent-modal .modal-content) {
          border: 3px solid #ffc107 !important;
          box-shadow: 0 0 20px rgba(255, 193, 7, 0.5) !important;
        }
      `}</style>
    </>
  );
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load initial state when app mounts
    const savedState = JSON.parse(localStorage.getItem("reduxState")) || {};
    if (savedState.menu?.categories) {
      dispatch(initializeMenu(savedState.menu.categories));
    }
  }, [dispatch]);

  return (
    <Router>
      <AuthWatcher />
      <Navbar />
      <GlobalNotifications />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/live-order" element={<LiveOrder />} />
              <Route path="/pending-payments" element={<PendingPayments />} />
              <Route path="/modifier" element={<Modifier />} />
              <Route path="/setting" element={<Setting />} />
              <Route path="/new-orders" element={<NewOrders />} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

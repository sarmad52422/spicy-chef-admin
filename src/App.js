// src/App.js
import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  Modal,
  Button,
  Spinner,
  Alert,
  Badge,
  Toast,
  ToastContainer,
} from "react-bootstrap";
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
import OrderDetails from "./components/orderDetails";
import ReceiptWrapper from "./components/printerWrapper";
import { API_URL } from "./constants/contants";

const NOTIFICATION_SOUND_URL = "/sound/notification.mp3";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function GlobalNotifications() {
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    variant: "success",
  });
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [currentNewOrder, setCurrentNewOrder] = useState(null);
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);
  const [orderStatusLoadingReject, setOrderStatusLoadingReject] =
    useState(false);
  const [orderStatusError, setOrderStatusError] = useState("");
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const audioRef = useRef(null);
  const location = useLocation();

  // Audio initialization and handlers
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        });
      }
      window.removeEventListener("click", handleUserInteraction);
    };
    window.addEventListener("click", handleUserInteraction);
    return () => window.removeEventListener("click", handleUserInteraction);
  }, []);

  useEffect(() => {
    const initAudio = () => {
      try {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.preload = "auto";
        audioRef.current.volume = 1.0;
        audioRef.current.addEventListener("canplaythrough", () => {
          console.log("Audio loaded and ready to play");
        });
        audioRef.current.addEventListener("error", (e) => {
          console.error("Audio loading error:", e);
        });
        audioRef.current.load();
      } catch (error) {
        console.error("Audio initialization failed:", error);
      }
    };
    initAudio();
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.loop = true;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log("Audio started playing successfully"))
            .catch((error) => {
              console.error("Audio play failed:", error);
              document.addEventListener(
                "click",
                () => {
                  audioRef.current
                    .play()
                    .catch((e) => console.log("Retry play failed:", e));
                },
                { once: true }
              );
            });
        }
      } catch (error) {
        console.error("Error in playNotificationSound:", error);
      }
    }
  };

  const stopNotificationSound = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.loop = false;
      } catch (error) {
        console.error("Error stopping audio:", error);
      }
    }
  };

  const updatePendingCount = (orders) => {
    const pending = orders.filter(
      (order) => order.status === "PENDING" || order.paymentStatus === "PENDING"
    ).length;
    setPendingOrderCount(pending);
  };

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const checkNewOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/order`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.status && Array.isArray(data.result?.data)) {
          const allOrders = data.result.data;

          const newStatusOrders = allOrders.filter(
            (order) => order.status === "NEW"
          );

          const existingOrderIds = JSON.parse(
            localStorage.getItem("existingOrderIds") || "[]"
          );

          const newOrder = newStatusOrders.find(
            (order) => !existingOrderIds.includes(order.id)
          );

          if (newOrder) {
            setCurrentNewOrder(newOrder);
            setNewOrderModal(true);
            setHasNewNotifications(true);
            playNotificationSound();
            localStorage.setItem(
              "existingOrderIds",
              JSON.stringify([...existingOrderIds, newOrder.id])
            );
          }

          // Update pending count based on filtered "NEW" orders
          updatePendingCount(newStatusOrders);
        }
      } catch (err) {
        console.error("Error checking new orders:", err);
      }
    };

    checkNewOrders();
    const interval = setInterval(checkNewOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleNewOrderAction = async (orderId, status) => {
    stopNotificationSound();
    setOrderStatusError("");

    if (status === "ACCEPTED" && status === "QUEUED") {
      setOrderStatusLoading(true);
    } else {
      setOrderStatusLoadingReject(true);
    }

    try {
      const token = localStorage.getItem("token");
      const orderStatus =
        status === "ACCEPTED"
          ? "ACCEPTED"
          : status === "QUEUED"
          ? "PENDING"
          : "REJECTED";
      console.log(orderStatus);
      const res = await fetch(
        `${API_URL}/api/order/status/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: orderStatus,
          }),
        }
      );
      const data = await res.json();
      console.log(`Data = ${JSON.stringify(data)}`);
      setOrderStatusError(`✅ Order ${status.toLowerCase()} successfully!`);

      if (status === "ACCEPTED") {
        calculateAndPrintBill();
      }

      setTimeout(() => {
        setNewOrderModal(false);
        setCurrentNewOrder(null);
        setOrderStatusError("");
        setOrderStatusLoading(false);
        setOrderStatusLoadingReject(false);

        if (status === "ACCEPTED") {
          setShowReceipt(true);
        }

        if (location.pathname === "/new-orders") {
          setTimeout(() => window.location.reload(), 1000);
        }
      }, 1000);
    } catch (err) {
      console.log(err);
      setOrderStatusError("Failed to update status");
    } finally {
      setOrderStatusLoading(false);
      setOrderStatusLoadingReject(false);
    }
  };
 const calculateAndPrintBill = () => {
  const totalAmountValue = Number(currentNewOrder.totalAmount || 0);
  const serviceFeeValue = Number(currentNewOrder.serviceFee || 0);
  const deliveryFeeValue = Number(currentNewOrder.deliveryFee || 0);

  const items = currentNewOrder.items.map((item) => {
    const rawPrice =
      item.item?.price ||
      item.variation?.price ||
      item.modifierOption?.price ||
      0;

    const quantity = item.quantity || 1;

    return {
      name:
        item.item?.name ||
        item.variation?.item?.name ||
        item.modifierOption?.name ||
        "Unknown Item",
      quantity,
      totalAmount: `£${(Number(rawPrice) * quantity).toFixed(2)}`,
      // Optional: Show discount per item if needed
      discount: item.item?.discount
        ? `${item.item.discount}%`
        : item.variation?.item?.discount
        ? `${item.variation.item.discount}%`
        : "0%",
    };
  });

  setReceiptData({
    orderId: currentNewOrder.orderId || currentNewOrder.id,
    address: currentNewOrder.address || "N/A",
    date: currentNewOrder.createdAt || new Date(),
    serviceFee: `£${serviceFeeValue.toFixed(2)}`,
    deliveryFee: `£${deliveryFeeValue.toFixed(2)}`,
    items,
    // Subtotal and orderTotal are equal to totalAmount here since backend handles discount
    subtotal: `£${totalAmountValue.toFixed(2)}`,
    orderTotal: `£${totalAmountValue.toFixed(2)}`,
    totalAmount: `£${totalAmountValue.toFixed(2)}`,
    discount: "£0.00", // discount already included in backend total
    tax: `£${Number(currentNewOrder.tax || 0).toFixed(2)}`,
    tip: `£${Number(currentNewOrder.tip || 0).toFixed(2)}`,
    total: `£${totalAmountValue.toFixed(2)}`,
    paymentMethod: currentNewOrder.paymentType || "Cash",
    paymentStatus: currentNewOrder.paymentStatus || "PAID",
  });
};


  const token = localStorage.getItem("token");
  if (!token) return null;

  return (
    <>
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

      <div
        className="bell-icon-global"
        style={{ position: "fixed", top: "20px", right: "400px", zIndex: 1000 }}
      >
        <div className="position-relative">
          <FaBell
            size={24}
            className={`cursor-pointer ${
              hasNewNotifications ? "text-danger" : "text-dark"
            }`}
            style={{
              animation: hasNewNotifications ? "shake 0.5s infinite" : "none",
              cursor: "pointer",
            }}
            onClick={() => {
              if (hasNewNotifications) {
                setHasNewNotifications(false);
                showAlert("Notifications cleared!", "info");
              }
            }}
          />
          {pendingOrderCount > 0 && (
            <Badge
              bg="danger"
              className="position-absolute top-0 start-100 translate-middle rounded-pill"
              style={{ fontSize: "0.7rem", minWidth: "18px" }}
            >
              {pendingOrderCount}
            </Badge>
          )}
        </div>
      </div>

      <Modal
        show={newOrderModal}
        centered
        backdrop="static"
        keyboard={false}
        className="urgent-modal"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Modal.Header
          className={
            orderStatusError && orderStatusError.includes("✅")
              ? "bg-success text-white"
              : "bg-warning text-dark"
          }
        >
          <Modal.Title>
            {orderStatusError && orderStatusError.includes("✅")
              ? "✅ Order Processing Complete"
              : "⚠️ New Order Received - Action Required"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {currentNewOrder ? (
            <>
              <div className="alert alert-warning mb-3" role="alert">
                <strong>🔔 Action Required!</strong> You must accept or reject
                this order.
              </div>
              <div>
                <strong>
                  Order #{currentNewOrder.orderId || currentNewOrder.id}
                </strong>
              </div>
              <div className="text-muted mb-2">
                {currentNewOrder.createdAt
                  ? new Date(currentNewOrder.createdAt).toLocaleString()
                  : "-"}
              </div>
              {Array.isArray(currentNewOrder.items) &&
              currentNewOrder.items.length > 0 ? (
                currentNewOrder.items.map((item, i) => {
                  let itemName =
                    item.item?.name ||
                    item.variation?.item?.name ||
                    item.modifierOption?.name ||
                    "Unknown Item";
                  let itemPrice =
                    item.item?.price ||
                    item.variation?.price ||
                    item.modifierOption?.price ||
                    0;
                  return (
                    <div
                      key={i}
                      className="mb-2 d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{itemName}</strong>
                      </div>
                      <div>
                        <strong>Qty:</strong> {item.quantity}{" "}
                        <span className="ms-3">
                          <strong>Price:</strong> £{0}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div>No items</div>
              )}
              {orderStatusError && (
                <Alert
                  variant="success"
                  className={`mt-2 ${
                    orderStatusError.includes("✅") ? "text-center fw-bold" : ""
                  }`}
                  style={
                    orderStatusError.includes("✅")
                      ? { fontSize: "1.1rem" }
                      : {}
                  }
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
            {orderStatusLoading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Accept"
            )}
          </Button>
          <Button
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              handleNewOrderAction(currentNewOrder.id, "REJECTED");
            }}
            disabled={orderStatusLoadingReject}
          >
            {orderStatusLoadingReject ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Reject"
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setNewOrderModal(false);
              stopNotificationSound();
              setCurrentNewOrder(null);
              handleNewOrderAction(currentNewOrder.id, "QUEUED");
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        show={showReceipt}
        onHide={() => setShowReceipt(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Order Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {receiptData && (
            <ReceiptWrapper
              orderId={receiptData.orderId}
              address={receiptData.address}
              date={receiptData.date}
              items={receiptData.items}
              subtotal={receiptData.subtotal}
              discount={receiptData.discount}
              tax={receiptData.tax}
              tip={receiptData.tip}
              total={receiptData.total}
              serviceFee={receiptData.serviceFee}
              paymentMethod={receiptData.paymentMethod}
              paymentStatus={receiptData.paymentStatus}
              orderTotal={receiptData.orderTotal}
              deliveryFee={receiptData.deliveryFee}
            />
          )}
        </Modal.Body>
      </Modal>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
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
        <Route
          path="/*"
          element={
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
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

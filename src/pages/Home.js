import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import { useReceiptPrinter } from "../hooks/printerHook";
import { API_URL } from "../constants/contants";
const Home = () => {
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { printReceipt, ReceiptModal } = useReceiptPrinter();

  const navigate = useNavigate();

  const handleOrderType = (type) => {
    localStorage.setItem("orderType", type);
    if (type === "IN-STORE") {
      navigate("/live-order");
    } else {
      setShowTypeModal(true);
    }
  };

  const handleCloseTypeModal = () => setShowTypeModal(false);
  const handleCloseDecisionModal = () => setShowDecisionModal(false);
  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/order`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()).result.data;

      const filtered = (data || []).filter(
        (order) => order.status === "PENDING"
      );
      setPendingOrders(filtered);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDecisionModal(true);
  };

  const handleAcceptOrder = async () => {
    setShowDecisionModal(false);
    try {
      
       await fetch(
          `${API_URL}/api/order/status/${selectedOrder?.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "ACCEPTED" }),
          }
        );
      printReceipt(selectedOrder);
    } catch (error) {
      console.error("Failed to update order status to ACCEPTED", error);
    }
  };
const token = localStorage.getItem("token");
      console.log(token);
  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        <div className="col-12 col-lg-8 col-md-8 border-end">
          <div className="p-4 w-75">
            <div className="border rounded p-3 d-flex gap-3">
              <div className="bg-danger text-white p-4 rounded flex-grow-1 text-center w-25">
                <h4>In-Store Order</h4>
                <i className="bi bi-cup-straw fs-1"></i>
                <button
                  className="btn btn-outline-light shadow-sm w-100 mt-3"
                  onClick={() => handleOrderType("IN-STORE")}
                >
                  Start In-Store
                </button>
              </div>
              <div className="bg-light p-4 rounded flex-grow-1 text-center">
                <h4 className="text-warning">Phone Order</h4>
                <button
                  className="btn btn-outline-dark shadow-sm w-100 my-2"
                  onClick={() => handleOrderType("COLLECTION")}
                >
                  Collection
                </button>
                <button
                  className="btn btn-outline-dark shadow-sm w-100"
                  onClick={() => handleOrderType("DELIVERY")}
                >
                  Delivery
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - PENDING orders table */}
        <div
          className="col-12 col-lg-4 col-md-4 bg-light d-flex flex-column p-3"
          style={{ height: "100vh", overflowY: "auto" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-primary m-0">Pending Orders</h5>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchPendingOrders}
              title="Refresh"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>

          {loading ? (
            <p className="text-center">Loading orders...</p>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center">
              <img
                src="/images/looker-icon.png"
                alt="no orders"
                style={{ width: "100px" }}
              />
              <h5 className="text-success mt-3">All caught up!</h5>
              <p>No pending orders found.</p>
            </div>
          ) : (
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {pendingOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{order.orderId}</td>
                    <td>{order.fullName || "N/A"}</td>

                    <td>{order.orderType}</td>
                    <td>
                      <span className="badge bg-warning text-dark">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Order Type Prompt */}
      <Modal show={showTypeModal} onHide={handleCloseTypeModal} centered>
        <Modal.Header className="justify-content-center">
          <Modal.Title>Start New Phone Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>No customer is currently on the line. Proceed anyway?</p>
          <p className="text-muted">
            For walk-in, we recommend using the In-Store option.
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant="light"
            className="text-dark"
            onClick={handleCloseTypeModal}
          >
            Go Back
          </Button>
          <Link
            to="/live-order"
            className="btn btn-outline-dark"
            onClick={handleCloseTypeModal}
          >
            Start Order
          </Link>
        </Modal.Footer>
      </Modal>

      {/* Modal: Accept/Reject */}
      <Modal
        show={showDecisionModal}
        onHide={handleCloseDecisionModal}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Accept or Reject Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Do you want to accept this order?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleCloseDecisionModal}>
            Reject
          </Button>
          <Button variant="success" onClick={handleAcceptOrder}>
            Accept
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Receipt */}
      {ReceiptModal()}
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from "react";
import { Table } from "react-bootstrap";

const PendingPayments = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const filterOrders = () => {
    if (activeTab === "pending") {
      return orders.filter(o => o.paymentStatus === "PENDING");
    } else if (activeTab === "card") {
      return orders.filter(o => o.paymentType === "CARD");
    } else if (activeTab === "cash") {
      return orders.filter(o => o.paymentType === "CASH");
    }
    return orders;
  };

  const renderTable = (data) => (
    <Table striped bordered hover responsive className="mt-4">
      <thead className="table-dark">
        <tr>
          <th>Order ID</th>
          <th>Customer Name</th>
          <th>Order Type</th>
          <th>Payment Type</th>
          <th>Address</th>
          <th>Date</th>
          <th>Amount (£)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={item.id || idx}>
            <td>{item.orderId}</td>
            <td>{item.fullName}</td>
            <td>{item.orderType}</td>
            <td>{item.paymentType}</td>
            <td>{item.address}</td>
            <td>{item.createdAt ? item.createdAt.slice(0, 10) : ''}</td>
            <td>£{Number(item.totalAmount || 0).toFixed(2)}</td>
            <td>{item.paymentStatus}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">All Payments</h2>

      {/* Stylish Tab Buttons */}
      <div className="d-flex gap-3 flex-wrap mb-4">
        <button
          className={`btn ${
            activeTab === "pending" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Amount
        </button>
        <button
          className={`btn ${
            activeTab === "card" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("card")}
        >
          Pay via Card
        </button>
        <button
          className={`btn ${
            activeTab === "cash" ? "btn-dark" : "btn-outline-dark"
          } rounded-pill px-4 shadow-sm`}
          onClick={() => setActiveTab("cash")}
        >
          Pay via Cash
        </button>
      </div>

      {/* Table content based on active tab */}
      {loading && <div>Loading orders...</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && renderTable(filterOrders())}
    </div>
  );
};

export default PendingPayments;
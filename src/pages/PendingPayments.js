import React, { useState } from "react";
import { Table } from "react-bootstrap";

const PendingPayments = () => {
  const [activeTab, setActiveTab] = useState("pending");

  const dummyData = {
    pending: [
      { name: "John Doe", date: "2025-06-22", amount: 25.0 },
      { name: "Jane Smith", date: "2025-06-21", amount: 40.5 },
    ],
    card: [
      { name: "Alice Johnson", date: "2025-06-20", amount: 60.0 },
      { name: "Bob Brown", date: "2025-06-18", amount: 32.75 },
    ],
    cash: [
      { name: "Charlie Davis", date: "2025-06-19", amount: 20.0 },
    ],
  };

  const renderTable = (data) => (
    <Table striped bordered hover responsive className="mt-4">
      <thead className="table-dark">
        <tr>
          <th>Customer Name</th>
          <th>Date</th>
          <th>Amount (£)</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            <td>{item.name}</td>
            <td>{item.date}</td>
            <td>£{item.amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Pending Payments</h2>

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
      {activeTab === "pending" && renderTable(dummyData.pending)}
      {activeTab === "card" && renderTable(dummyData.card)}
      {activeTab === "cash" && renderTable(dummyData.cash)}
    </div>
  );
};

export default PendingPayments;
import React, { useState } from "react";
import { Accordion, Button, Row, Col, Badge } from "react-bootstrap";

const dummyOrders = [
  {
    id: "013",
    date: "05 Dec 2024, 09:48 AM",
    items: [
      { name: "Vegetable Mixups", desc: "Vegetable Fritters with Egg", qty: 1 },
      {
        name: "Baked Pasted Dishes",
        desc: "Vegetable Fritters with Egg",
        qty: 1,
      },
    ],
  },
  {
    id: "014",
    date: "06 Dec 2024, 10:30 AM",
    items: [{ name: "Spicy Rolls", desc: "Stuffed with chicken", qty: 2 }],
  },
];

export default function NewOrders() {
  const [activeTab, setActiveTab] = useState("new");
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);

  const handleAccept = (order) => {
    setAcceptedOrders([...acceptedOrders, order]);
  };

  const handleReject = (order) => {
    setRejectedOrders([...rejectedOrders, order]);
  };

  const remainingOrders = dummyOrders.filter(
    (order) =>
      !acceptedOrders.find((o) => o.id === order.id) &&
      !rejectedOrders.find((o) => o.id === order.id)
  );

  const renderOrder = (order, index, showButtons = true, status = null) => (
    <Accordion.Item
      eventKey={index.toString()}
      key={`${status}-${order.id}-${index}`}
    >
      <Accordion.Header>
        <Row className="w-100">
          <Col xs={6}>
            <div>
              <strong>Order #{order.id}</strong>
            </div>
            <div className="text-muted">{order.date}</div>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(order);
                  }}
                >
                  Accept
                </Button>
                <Button
                  variant="outline-danger me-2"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(order);
                  }}
                >
                  Reject
                </Button>
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
        {order.items.map((item, i) => (
          <div key={i} className="mb-2 d-flex justify-content-between align-items-center">
            <div>
              <div>
                <strong>{item.name}</strong>
              </div>
              <div className="text-muted">{item.desc}</div>
            </div>
            <div>
              <strong>Qty:</strong> {item.qty}
            </div>
          </div>
        ))}
      </Accordion.Body>
    </Accordion.Item>
  );

  return (
    <div className="container mt-4">
      <h4>Orders</h4>

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

      {/* Accordion Content Based on Active Tab */}
      <Accordion>
        {activeTab === "new" && (
          <>
            {remainingOrders.length === 0 && <div>No new orders</div>}
            {remainingOrders.map((order, idx) => renderOrder(order, idx))}
          </>
        )}

        {activeTab === "accepted" && (
          <>
            {acceptedOrders.length === 0 && <div>No accepted orders</div>}
            {acceptedOrders.map((order, idx) =>
              renderOrder(order, idx, false, "accepted")
            )}
          </>
        )}

        {activeTab === "rejected" && (
          <>
            {rejectedOrders.length === 0 && <div>No rejected orders</div>}
            {rejectedOrders.map((order, idx) =>
              renderOrder(order, idx, false, "rejected")
            )}
          </>
        )}
      </Accordion>
    </div>
  );
}

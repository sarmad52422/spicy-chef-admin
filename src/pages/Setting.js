import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";

const allDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function Setting() {
  const [deliveryFee, setDeliveryFee] = useState("");
  const [serviceFee, setServiceFee] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [feeStatus, setFeeStatus] = useState(null);
  const [feeError, setFeeError] = useState(null);
  const [loading, setLoading] = useState(false);

  // New: Opening hours state for each day
  const [openingHours, setOpeningHours] = useState(() =>
    allDays.reduce((acc, day) => {
      acc[day.toLowerCase()] = { start: "", close: "" };
      return acc;
    }, {})
  );

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setFeeError(null);
      const branch = JSON.parse(localStorage.getItem("selectedBranch"));
      if (!branch?.id) {
        setFeeError("No branch selected.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/settings/${branch.id}`);
        const data = await res.json();
        if (data.status && data.result?.data?.setting) {
          setDeliveryFee(data.result.data.setting.deliveryFee?.toString() || "");
          setServiceFee(data.result.data.setting.serviceFee?.toString() || "");
          setDeliveryTime(data.result.data.setting.deliveryTime?.toString() || "");
          // Optionally: setOpeningHours from backend if available
        }
      } catch (err) {
        setFeeError("Failed to fetch settings.");
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleDeliverySave = async () => {
    setFeeStatus(null);
    setFeeError(null);
    const branch = JSON.parse(localStorage.getItem("selectedBranch"));
    if (!branch?.id) {
      setFeeError("No branch selected.");
      return;
    }
    try {
      const res = await fetch("https://api.eatmeonline.co.uk/api/admin/delievery-fee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          branch_id: branch.id,
          deliveryFee: Number(deliveryFee),
          serviceFee: Number(serviceFee),
          deliveryTime: Number(deliveryTime),
        }),
      });
      const data = await res.json();
      if (data.status) {
        setFeeStatus("Delivery and service fee updated successfully.");
      } else {
        setFeeError(data.message || "Failed to update delivery/service fee.");
      }
    } catch (err) {
      setFeeError("Failed to update delivery/service fee.");
    }
  };

  // New: Save handler for opening hours
  const handleTimingSave = () => {
    console.log("Opening Hours Saved:", openingHours);
    // TODO: Send openingHours to backend
  };

  return (
    <div className="container mt-5">
      <h4>Setting</h4>
      <Row>
        {/* Delivery Fee - Left Column */}
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Delivery Fee</strong>{" "}
              <span className="text-muted">Per 1 Mile</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Add Delivery Fee"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Service Fee</strong>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Add Service Fee"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Delivery Time</strong> <span className="text-muted">(in minutes)</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Add Delivery Time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          {feeStatus && <Alert className="alert-success" variant="success">{feeStatus}</Alert>}
          {feeError && <Alert className="alert-success" variant="danger">{feeError}</Alert>}
          <Button variant="primary" onClick={handleDeliverySave}>
            Save
          </Button>
        </Col>

        {/* Restaurant Timing - Right Column */}
        <Col md={6}>
          <Card className="p-4">
            <h5>Restaurant Timing</h5>
            {allDays.map((day) => (
              <div key={day} className="mb-3 d-flex align-items-center justify-content-between">
                <div style={{ width: 100, textTransform: "capitalize" }}>{day}</div>
                <input
                  type="time"
                  value={openingHours[day.toLowerCase()].start}
                  onChange={e =>
                    setOpeningHours(prev => ({
                      ...prev,
                      [day.toLowerCase()]: {
                        ...prev[day.toLowerCase()],
                        start: e.target.value
                      }
                    }))
                  }
                  className="form-control mx-2"
                  style={{ width: 120 }}
                />
                <span>to</span>
                <input
                  type="time"
                  value={openingHours[day.toLowerCase()].close}
                  onChange={e =>
                    setOpeningHours(prev => ({
                      ...prev,
                      [day.toLowerCase()]: {
                        ...prev[day.toLowerCase()],
                        close: e.target.value
                      }
                    }))
                  }
                  className="form-control mx-2"
                  style={{ width: 120 }}
                />
              </div>
            ))}
            <Button className="mt-3" onClick={handleTimingSave}>
              Save
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
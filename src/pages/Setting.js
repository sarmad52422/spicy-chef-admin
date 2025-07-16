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
  const [discount, setDiscount] = useState("");
  const [discountError, setDiscountError] = useState("");
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
      setDiscountError("");
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
          setDiscount(data.result.data.setting.discount?.toString() || "");
          // Optionally: setOpeningHours from backend if available
        }
      } catch (err) {
        setFeeError("Failed to fetch settings.");
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  // Discount validation function
  const validateDiscount = (value) => {
    setDiscountError("");
    if (value === "") return true;
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      setDiscountError("Discount must be a valid number");
      return false;
    }
    if (numValue < 0) {
      setDiscountError("Discount cannot be negative");
      return false;
    }
    if (numValue > 100) {
      setDiscountError("Discount cannot be more than 100%");
      return false;
    }
    return true;
  };

  // Handle discount change with validation
  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setDiscount(value);
    validateDiscount(value);
  };

  const handleDeliverySave = async () => {
    setFeeStatus(null);
    setFeeError(null);
    
    // Validate discount before saving
    if (!validateDiscount(discount)) {
      setFeeError("Please fix the discount validation error before saving.");
      return;
    }
    
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
          discount: discount ? Number(discount) : 0,
        }),
      });
      const data = await res.json();
      if (data.status) {
        setFeeStatus("Settings updated successfully.");
      } else {
        setFeeError(data.message || "Failed to update settings.");
      }
    } catch (err) {
      setFeeError("Failed to update settings.");
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
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Discount</strong> <span className="text-muted">(%)</span>
            </Form.Label>
            <Form.Control
              type="number"
              placeholder="Add Discount Percentage"
              value={discount}
              onChange={handleDiscountChange}
              disabled={loading}
              min="0"
              max="100"
              step="0.01"
              isInvalid={!!discountError}
            />
            {discountError && (
              <Form.Control.Feedback type="invalid">
                {discountError}
              </Form.Control.Feedback>
            )}
            <Form.Text className="text-muted">
              Enter discount percentage (0-100%). Leave empty for no discount.
            </Form.Text>
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
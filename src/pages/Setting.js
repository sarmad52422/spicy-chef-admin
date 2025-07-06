import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";

export default function Setting() {
  const [deliveryFee, setDeliveryFee] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [closingTime, setClosingTime] = useState("00:00");
  const [selectedDays, setSelectedDays] = useState([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);
  const [feeStatus, setFeeStatus] = useState(null);
  const [feeError, setFeeError] = useState(null);
  const [loading, setLoading] = useState(false);

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
        }
      } catch (err) {
        setFeeError("Failed to fetch settings.");
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleDayChange = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

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
        }),
      });
      const data = await res.json();
      if (data.status) {
        setFeeStatus("Delivery fee updated successfully.");
      } else {
        setFeeError(data.message || "Failed to update delivery fee.");
      }
    } catch (err) {
      setFeeError("Failed to update delivery fee.");
    }
  };

  const handleTimingSave = () => {
    console.log("Timing Saved:", { startTime, closingTime, selectedDays });
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
            <Row className="mb-3">
              <Col>
                <Form.Label>Start Time</Form.Label>
                <Form.Select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {generateTimeOptions()}
                </Form.Select>
              </Col>
              <Col>
                <Form.Label>Closing Time</Form.Label>
                <Form.Select
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                >
                  {generateTimeOptions()}
                </Form.Select>
              </Col>
            </Row>

            {allDays.map((day) => {
              const id = `day-${day.toLowerCase()}`;
              return (
                <div key={day} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayChange(day)}
                    disabled={day === "Sunday"}
                  />
                  <label className="form-check-label" htmlFor={id}>
                    {day}
                  </label>
                </div>
              );
            })}

            <Button className="mt-3" onClick={handleTimingSave}>
              Save
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    const time = i.toString().padStart(2, "0") + ":00";
    options.push(
      <option key={time} value={time}>
        {time}
      </option>
    );
  }
  return options;
};
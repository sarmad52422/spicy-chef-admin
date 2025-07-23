import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import { API_URL } from "../constants/contants";

const BranchSelectorModal = ({ show, onClose, onSelect }) => {
  const selectedBranch = useSelector((state) => state.branch.selectedBranch);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/branch`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.result?.data) {
          setBranches(data.result.data);
        } else {
          setError("Failed to fetch branches");
        }
      })
      .catch(() => setError("Failed to fetch branches"))
      .finally(() => setLoading(false));
  }, [show]);

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>From Branch</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <div>Loading branches...</div>}
        {error && <div className="text-danger">{error}</div>}
        {!loading && !error && branches.map((branch) => {
          const isSelected = selectedBranch?.id === branch.id;
          return (
            <div
              key={branch.id}
              className={`d-flex justify-content-between align-items-center p-3 mb-2 rounded shadow-sm ${
                isSelected ? "bg-dark text-white" : "bg-light"
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => {
                onSelect(branch);
                onClose();
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <img
                  src="/images/branch-img.jpg"
                  alt={branch.name}
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "10px",
                    objectFit: "cover",
                  }}
                />
                <div>
                  <h6 className={`mb-0 fw-bold ${isSelected ? "text-white" : "text-dark"}`}>
                    {branch.name}
                  </h6>
                  <small className={isSelected ? "text-white-50" : "text-muted"}>
                    {branch.address || "No address"}
                  </small>
                </div>
              </div>
              <strong className={isSelected ? "text-white" : "text-dark"}>
                {branch.distance ? `${branch.distance} miles` : ""}
              </strong>
            </div>
          );
        })}
      </Modal.Body>
    </Modal>
  );
};

export default BranchSelectorModal;
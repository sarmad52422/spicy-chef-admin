import React from "react";
import { Modal } from "react-bootstrap";
import { useSelector } from "react-redux";

const branches = [
  { id: 1, name: "Blackely", distance: "3.5", address: "dummy address" },
  { id: 2, name: "Bury", distance: "1.0", address: "dummy address" },
  { id: 3, name: "Redcliff", distance: "5.0", address: "dummy address" },
];

const BranchSelectorModal = ({ show, onClose, onSelect }) => {
  const selectedBranch = useSelector((state) => state.branch.selectedBranch);

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>From Branch</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {branches.map((branch) => {
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
                    {branch.address}
                  </small>
                </div>
              </div>
              <strong className={isSelected ? "text-white" : "text-dark"}>
                {branch.distance} miles
              </strong>
            </div>
          );
        })}
      </Modal.Body>
    </Modal>
  );
};

export default BranchSelectorModal;
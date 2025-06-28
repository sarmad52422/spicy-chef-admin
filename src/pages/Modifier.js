import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Row,
  Col,
  InputGroup,
  Toast,
  ToastContainer,
} from "react-bootstrap";

export default function Modifier() {
  const [showModal, setShowModal] = useState(false);
  const [modifiers, setModifiers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [newModifiers, setNewModifiers] = useState([
    {
      name: "",
      options: [{ name: "", price: "" }],
    },
  ]);

  // Fetch modifiers function (define early so it's in scope)
  const fetchModifiers = async () => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/modifier?branch_id=${branchId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status && Array.isArray(data.result?.data)) {
        setModifiers(data.result.data);
      } else {
        setModifiers([]);
        setError(data.message || "Failed to fetch modifiers");
      }
    } catch (err) {
      setModifiers([]);
      setError("Failed to fetch modifiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const branch = JSON.parse(localStorage.getItem("selectedBranch"));
    if (branch && branch.id) setBranchId(branch.id);
  }, []);

  useEffect(() => {
    if (branchId) {
      fetchModifiers();
    }
    // eslint-disable-next-line
  }, [branchId]);

  const openCreateModal = () => {
    setEditingIndex(null);
    setNewModifiers([
      {
        name: "",
        options: [{ name: "", price: "" }],
      },
    ]);
    setShowModal(true);
  };

  const openEditModal = (index) => {
    setEditingIndex(index);
    const mod = modifiers[index];
    const edited = {
      name: mod.name,
      options: (mod.modifierOption || mod.options || []).map((opt) => ({
        id: opt.id,
        name: opt.name,
        price: opt.price,
      })),
    };
    setNewModifiers([edited]);
    setShowModal(true);
  };

  const handleAddModifierBlock = () => {
    setNewModifiers([
      ...newModifiers,
      { name: "", options: [{ name: "", price: "" }] },
    ]);
  };

  const handleRemoveModifierBlock = (index) => {
    const updated = [...newModifiers];
    updated.splice(index, 1);
    setNewModifiers(updated);
  };

  const handleModifierChange = (index, field, value) => {
    const updated = [...newModifiers];
    updated[index][field] = value;
    setNewModifiers(updated);
  };

  const handleOptionChange = (modIndex, optIndex, field, value) => {
    const updated = [...newModifiers];
    updated[modIndex].options[optIndex][field] = value;
    setNewModifiers(updated);
  };

  const handleAddOption = (modIndex) => {
    const updated = [...newModifiers];
    updated[modIndex].options.push({ name: "", price: "" });
    setNewModifiers(updated);
  };

  const handleRemoveOption = (modIndex, optIndex) => {
    const updated = [...newModifiers];
    updated[modIndex].options.splice(optIndex, 1);
    if (updated[modIndex].options.length === 0) {
      updated[modIndex].options.push({ name: "", price: "" });
    }
    setNewModifiers(updated);
  };

  const handleCreateOrUpdateModifiers = async () => {
    const valid = newModifiers.every(
      (mod) =>
        mod.name.trim() &&
        mod.options.every((opt) => opt.name.trim() && opt.price !== "")
    );

    if (!valid) {
      alert("Please fill out all modifier names, option names, and prices.");
      return;
    }

    const token = localStorage.getItem("token");

    if (editingIndex !== null) {
      // Update modifier
      const mod = newModifiers[0];
      const id = modifiers[editingIndex].id;
      const payload = {
        name: mod.name.trim(),
        modifierOptions: mod.options.map((opt) =>
          opt.id
            ? { id: opt.id, name: opt.name.trim(), price: Number(opt.price || "0") }
            : { name: opt.name.trim(), price: Number(opt.price || "0") }
        ),
      };
      setLoading(true);
      setSuccess("");
      setError("");
      try {
        const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/modifier/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.status) {
          setSuccess("Modifier updated successfully!");
          setShowModal(false);
          setEditingIndex(null);
          setNewModifiers([{ name: "", options: [{ name: "", price: "" }] }]);
          // Refresh modifiers
          fetchModifiers();
        } else {
          setError(data.message || "Failed to update modifier");
        }
      } catch (err) {
        setError("Failed to update modifier");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Create modifier (existing code)
    const payload = newModifiers.map((mod) => ({
      name: mod.name.trim(),
      branch_id: branchId,
      modifierOptions: mod.options.map((opt) => ({
        name: opt.name.trim(),
        price: Number(opt.price || "0"),
      })),
    }));

    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("https://api.eatmeonline.co.uk/api/admin/modifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        setSuccess("Modifiers created successfully!");
        setShowModal(false);
        setEditingIndex(null);
        setNewModifiers([{ name: "", options: [{ name: "", price: "" }] }]);
        // Refresh modifiers
        fetchModifiers();
      } else {
        setError(data.message || "Failed to create modifiers");
      }
    } catch (err) {
      setError("Failed to create modifiers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModifier = async (index) => {
    if (!window.confirm("Are you sure you want to delete this modifier?")) return;
    const id = modifiers[index].id;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/modifier/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        setSuccess("Modifier deleted successfully!");
        fetchModifiers();
      } else {
        setError(data.message || "Failed to delete modifier");
      }
    } catch (err) {
      setError("Failed to delete modifier");
    } finally {
      setLoading(false);
    }
  };

  const filteredModifiers = modifiers.filter(
    (mod) =>
      (mod.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((mod.modifierOption || mod.options || []).some((opt) =>
        (opt.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      ))
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Modifiers</h2>
        <Button onClick={openCreateModal}>+ Create Modifiers</Button>
      </div>

      <Form.Control
        type="text"
        placeholder="Search by name or options..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-3"
      />

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Modifier Name</th>
            <th>Options</th>
            <th>Prices</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" className="text-center">Loading...</td></tr>
          ) : error ? (
            <tr><td colSpan="5" className="text-danger text-center">{error}</td></tr>
          ) : filteredModifiers.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No matching modifiers found.
              </td>
            </tr>
          ) : (
            filteredModifiers.map((mod, index) => (
              <tr key={mod.id}>
                <td>{index + 1}</td>
                <td>{mod.name}</td>
                <td>{(mod.modifierOption || mod.options || []).map((opt) => opt.name).join(", ")}</td>
                <td>{(mod.modifierOption || mod.options || []).map((opt) => `$${opt.price}`).join(", ")}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => openEditModal(index)}
                    className="me-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteModifier(index)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Create/Edit Modifiers Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingIndex !== null ? "Edit Modifier" : "Create Multiple Modifiers"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {newModifiers.map((modifier, modIndex) => (
            <div key={modIndex} className="border p-3 mb-3 rounded">
              <Row className="align-items-center mb-2">
                <Col>
                  <Form.Label>Modifier Name</Form.Label>
                  <Form.Control
                    value={modifier.name}
                    onChange={(e) =>
                      handleModifierChange(modIndex, "name", e.target.value)
                    }
                    placeholder="e.g. Size"
                  />
                </Col>
                <Col md="auto">
                  {newModifiers.length > 1 && (
                    <Button
                      variant="outline-danger"
                      onClick={() => handleRemoveModifierBlock(modIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </Col>
              </Row>

              <Form.Label>Options</Form.Label>
              {modifier.options.map((opt, optIndex) => (
                <Row key={optIndex} className="mb-2">
                  <Col md={6}>
                    <Form.Control
                      placeholder="Option Name"
                      value={opt.name}
                      onChange={(e) =>
                        handleOptionChange(
                          modIndex,
                          optIndex,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        placeholder="Price"
                        value={opt.price}
                        onChange={(e) =>
                          handleOptionChange(
                            modIndex,
                            optIndex,
                            "price",
                            e.target.value
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                    </InputGroup>
                  </Col>
                  <Col md={2}>
                    {modifier.options.length > 1 && (
                      <Button
                        variant="outline-danger"
                        onClick={() =>
                          handleRemoveOption(modIndex, optIndex)
                        }
                      >
                        ✕
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleAddOption(modIndex)}
              >
                + Add Option
              </Button>
            </div>
          ))}

          {editingIndex === null && (
            <Button variant="success" onClick={handleAddModifierBlock}>
              + Add Another Modifier
            </Button>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateOrUpdateModifiers} disabled={loading}>
            {loading ? "Saving..." : editingIndex !== null ? "Update Modifier" : "Save Modifiers"}
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          onClose={() => setSuccess("")}
          show={!!success}
          bg="success"
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{success}</Toast.Body>
        </Toast>
        <Toast
          onClose={() => setError("")}
          show={!!error}
          bg="danger"
          delay={4000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Error</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{error}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
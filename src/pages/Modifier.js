import React, { useState } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";

export default function Modifier() {
  const [showModal, setShowModal] = useState(false);
  const [modifiers, setModifiers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const [newModifiers, setNewModifiers] = useState([
    {
      name: "",
      options: [{ name: "", price: "" }],
    },
  ]);

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
      options: mod.options.map((opt) => ({ ...opt })),
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

  const handleCreateOrUpdateModifiers = () => {
    const valid = newModifiers.every(
      (mod) =>
        mod.name.trim() &&
        mod.options.every((opt) => opt.name.trim() && opt.price !== "")
    );

    if (!valid) {
      alert("Please fill out all modifier names, option names, and prices.");
      return;
    }

    const formatted = newModifiers.map((mod) => ({
      id: Date.now() + Math.random(),
      name: mod.name.trim(),
      options: mod.options.map((opt) => ({
        name: opt.name.trim(),
        price: parseFloat(opt.price || "0").toFixed(2),
      })),
    }));

    if (editingIndex !== null) {
      const updated = [...modifiers];
      updated[editingIndex] = { ...formatted[0], id: updated[editingIndex].id };
      setModifiers(updated);
    } else {
      setModifiers([...modifiers, ...formatted]);
    }

    setShowModal(false);
    setEditingIndex(null);
    setNewModifiers([{ name: "", options: [{ name: "", price: "" }] }]);
  };

  const handleDeleteModifier = (index) => {
    if (window.confirm("Are you sure you want to delete this modifier?")) {
      const updated = [...modifiers];
      updated.splice(index, 1);
      setModifiers(updated);
    }
  };

  const filteredModifiers = modifiers.filter(
    (mod) =>
      mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.options.some((opt) =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
          {filteredModifiers.length === 0 ? (
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
                <td>{mod.options.map((opt) => opt.name).join(", ")}</td>
                <td>{mod.options.map((opt) => `$${opt.price}`).join(", ")}</td>
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
          <Button variant="primary" onClick={handleCreateOrUpdateModifiers}>
            {editingIndex !== null ? "Update Modifier" : "Save Modifiers"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Select from "react-select";

const AddCategoryModal = ({ show, onHide, onSave, editData = null }) => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [modifiers, setModifiers] = useState([]);
  const [subCategories, setSubCategories] = useState([
    {
      name: "",
      price: "",
      discount: "",
      id: Date.now(),
      image: null,
      description: "",
      variations: [{ name: "", price: "" }],
      modifiers: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDeal, setIsDeal] = useState(false);

  useEffect(() => {
    if (editData) {
      if (editData.isSubCategory) {
        setCategoryName("");
        setCategoryImage(null);
        setSubCategories([
          {
            name: String(editData.name || ""),
            price: editData.price !== undefined ? String(editData.price) : "",
            discount:
              editData.discount !== undefined ? String(editData.discount) : "",
            id: editData.id || Date.now(),
            image: editData.image || null,
            description: editData.description || "",
            variations: editData.variations ||
              editData.variation || [{ name: "", price: "" }],
            modifiers: Array.isArray(editData.modifiers)
              ? editData.modifiers.map((m) =>
                  typeof m === "object" ? m.id : m
                )
              : [],
          },
        ]);
      } else {
        setCategoryName(String(editData.name || ""));
        setCategoryImage(editData.image || null);
        setIsDeal(!!editData.is_deal);
        const items = Array.isArray(editData.subCategories)
          ? editData.subCategories
          : Array.isArray(editData.item)
          ? editData.item
          : [];
        setSubCategories(
          items.length > 0
            ? items.map((sub) => ({
                name: String(sub.name || ""),
                price: sub.price !== undefined ? String(sub.price) : "",
                discount:
                  sub.discount !== undefined ? String(sub.discount) : "",
                id: sub.id || Date.now() + Math.random(),
                image: sub.image || null,
                description: sub.description || "",
                variations: sub.variations ||
                  sub.variation || [{ name: "", price: "" }],
                // Extract modifier IDs from itemModifier array
                modifiers: Array.isArray(sub.itemModifier)
                  ? sub.itemModifier
                      .map(
                        (im) => im.modifierId || (im.modifier && im.modifier.id)
                      )
                      .filter(Boolean)
                  : Array.isArray(sub.modifiers)
                  ? sub.modifiers.map((m) => (typeof m === "object" ? m.id : m))
                  : [],
              }))
            : [
                {
                  name: "",
                  price: "",
                  discount: "",
                  id: Date.now(),
                  image: null,
                  description: "",
                  variations: [{ name: "", price: "" }],
                  modifiers: [],
                },
              ]
        );
      }
    } else {
      setCategoryName("");
      setCategoryImage(null);
      setIsDeal(false);
      setSubCategories([
        {
          name: "",
          price: "",
          discount: "",
          id: Date.now(),
          image: null,
          description: "",
          variations: [{ name: "", price: "" }],
          modifiers: [],
        },
      ]);
    }
  }, [editData, show]);

  useEffect(() => {
    const fetchModifiers = async () => {
      const branch = JSON.parse(localStorage.getItem("selectedBranch"));
      if (!branch?.id) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://api.eatmeonline.co.uk/api/admin/modifier?branch_id=${branch.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.status && Array.isArray(data.result?.data)) {
          setModifiers(data.result.data);
        } else {
          setModifiers([]);
        }
      } catch {
        setModifiers([]);
      }
    };
    fetchModifiers();
  }, [show]);

  useEffect(() => {
    if (editData) {
      let items = [];
      if (editData.isSubCategory) {
        items = [editData];
      } else if (Array.isArray(editData.subCategories)) {
        items = editData.subCategories;
      } else if (Array.isArray(editData.item)) {
        items = editData.item;
      }
      if (modifiers.length > 0 && items.length > 0) {
        setSubCategories((subCategories) =>
          subCategories.map((sub, idx) => {
            const item = items[idx] || {};
            // Extract modifier IDs from itemModifier array
            const existingModifierIds = Array.isArray(item.itemModifier)
              ? item.itemModifier
                  .map((im) => im.modifierId || (im.modifier && im.modifier.id))
                  .filter(Boolean)
              : Array.isArray(item.modifiers)
              ? item.modifiers.map((m) => (typeof m === "object" ? m.id : m))
              : [];
            return {
              ...sub,
              modifiers: existingModifierIds,
            };
          })
        );
      }
    }
  }, [editData, modifiers, show]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await axios.post(
        "https://api.eatmeonline.co.uk/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (res.data.status && res.data.result?.data) {
        return res.data.result.data;
      } else {
        alert("Image upload failed");
        return null;
      }
    } catch (err) {
      alert("Image upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageFileChange = async (e, index = null) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert("Image size must be less than or equal to 100MB.");
        return;
      }
      const url = await uploadImage(file);
      if (url) {
        if (index !== null) {
          const updated = subCategories.map((sub, i) =>
            i === index ? { ...sub, image: url } : sub
          );
          setSubCategories(updated);
        } else {
          setCategoryImage(url);
        }
      }
    }
  };

  const handleChangeSub = (index, field, value) => {
    const updated = subCategories.map((sub, i) =>
      i === index ? { ...sub, [field]: value } : sub
    );
    setSubCategories(updated);
  };

  const handleModifierSelect = (index, selectedIds) => {
    const updated = subCategories.map((sub, i) =>
      i === index ? { ...sub, modifiers: selectedIds } : sub
    );
    setSubCategories(updated);
  };

  const addSubField = () => {
    setSubCategories([
      ...subCategories,
      {
        name: "",
        price: "",
        discount: "",
        id: Date.now() + Math.random(),
        image: null,
        description: "",
        variations: [{ name: "", price: "" }],
        modifiers: [],
      },
    ]);
  };

  const removeSubField = (index) => {
    const updated = subCategories.filter((_, i) => i !== index);
    setSubCategories(
      updated.length
        ? updated
        : [
            {
              name: "",
              price: "",
              discount: "",
              id: Date.now(),
              image: null,
              description: "",
              variations: [{ name: "", price: "" }],
              modifiers: [],
            },
          ]
    );
  };

  const handleVariationChange = (subIndex, varIndex, field, value) => {
    const updated = subCategories.map((sub, i) => {
      if (i === subIndex) {
        const updatedVars = sub.variations.map((v, j) =>
          j === varIndex ? { ...v, [field]: value } : v
        );
        return { ...sub, variations: updatedVars };
      }
      return sub;
    });
    setSubCategories(updated);
  };

  const addVariationField = (subIndex) => {
    const updated = subCategories.map((sub, i) => {
      if (i === subIndex) {
        return {
          ...sub,
          variations: [...sub.variations, { name: "", price: "" }],
        };
      }
      return sub;
    });
    setSubCategories(updated);
  };

  const removeVariationField = (subIndex, varIndex) => {
    const updated = subCategories.map((sub, i) => {
      if (i === subIndex) {
        const newVars = sub.variations.filter((_, j) => j !== varIndex);
        return {
          ...sub,
          variations: newVars.length ? newVars : [{ name: "", price: "" }],
        };
      }
      return sub;
    });
    setSubCategories(updated);
  };

  const handleSubmit = async () => {
    const validSubs = subCategories
      .filter((sc) => sc.name.trim())
      .map((sc) => ({
        name: sc.name.trim(),
        price: sc.price === "" ? 0 : Number(sc.price),
        discount: sc.discount === "" ? 0 : Number(sc.discount),
        id: sc.id || Date.now() + Math.random(),
        image: sc.image,
        description: sc.description || "",
        variation:
          (sc.variations || []).filter(
            (v) => v.name.trim() && v.price !== "" && v.price !== undefined
          ).length > 0
            ? (sc.variations || [])
                .filter(
                  (v) =>
                    v.name.trim() && v.price !== "" && v.price !== undefined
                )
                .map((v) => ({
                  ...v,
                  id: v.id || uuidv4(),
                }))
            : [
                {
                  id: uuidv4(),
                  name: sc.name.trim(),
                  price: sc.price === "" ? 0 : Number(sc.price),
                },
              ],
        modifiers: sc.modifiers || [],
      }));

    setLoading(true);
    try {
      if (editData?.isSubCategory) {
        await onSave({ ...editData, ...validSubs[0] }, true);
      } else {
        const payload = {
          name: categoryName.trim(),
          image: categoryImage,
          subCategories: validSubs,
          is_deal: isDeal, // Pass isDeal state up to parent
        };
        await onSave(payload);
      }
      onHide();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={loading ? undefined : onHide} size="lg" centered>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          {editData?.isSubCategory
            ? "Edit Menu Item"
            : editData
            ? "Edit Category"
            : "Add Category"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {!editData?.isSubCategory && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Category Name</Form.Label>
                <Form.Control
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category Image</Form.Label>
                {categoryImage && (
                  <div className="mb-2">
                    <img
                      src={categoryImage}
                      alt="Category Preview"
                      style={{ maxWidth: "150px", borderRadius: "8px" }}
                    />
                  </div>
                )}
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e)}
                  disabled={uploading}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="isDealCheckbox">
                <Form.Check
                  type="checkbox"
                  label="Is Deal"
                  checked={isDeal}
                  onChange={(e) => setIsDeal(e.target.checked)}
                />
              </Form.Group>
            </>
          )}
          <h5>Menu Item</h5>
          {subCategories.map((sub, index) => (
            <div key={sub.id} className="border p-3 rounded mb-4">
              <Row className="mb-2 g-2">
                <Col md={3}>
                  <Form.Control
                    placeholder="Item Name"
                    value={sub.name}
                    onChange={(e) =>
                      handleChangeSub(index, "name", e.target.value)
                    }
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    placeholder="Price"
                    type="number"
                    value={sub.price}
                    onChange={(e) =>
                      handleChangeSub(index, "price", e.target.value)
                    }
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    placeholder="Discount"
                    type="number"
                    value={sub.discount}
                    onChange={(e) =>
                      handleChangeSub(index, "discount", e.target.value)
                    }
                  />
                </Col>
                <Col md={5}>
                  {sub.image && (
                    <div className="mt-2">
                      <img
                        src={sub.image}
                        alt="Menu Item Preview"
                        style={{
                          maxWidth: "100px",
                          maxHeight: "100px",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, index)}
                    disabled={uploading}
                  />
                </Col>
              </Row>
              <Form.Control
                as="textarea"
                rows={2}
                className="mb-3"
                placeholder="Description"
                value={sub.description}
                onChange={(e) =>
                  handleChangeSub(index, "description", e.target.value)
                }
              />

              <Form.Label>
                <strong>Variations</strong>
              </Form.Label>
              {sub.variations.map((v, varIndex) => (
                <Row key={varIndex} className="g-2 mb-2 align-items-center">
                  <Col md={6}>
                    <Form.Control
                      placeholder="Variation Name"
                      value={v.name}
                      onChange={(e) =>
                        handleVariationChange(
                          index,
                          varIndex,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Control
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) =>
                        handleVariationChange(
                          index,
                          varIndex,
                          "price",
                          e.target.value
                        )
                      }
                    />
                  </Col>
                  <Col md={2}>
                    {sub.variations.length > 1 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeVariationField(index, varIndex)}
                      >
                        Remove
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                className="mb-3"
                onClick={() => addVariationField(index)}
              >
                + Add Variation
              </Button>

              <Form.Group className="mb-3">
                <Form.Label>Modifiers</Form.Label>
                <Select
                  isMulti
                  options={modifiers.map((mod) => ({
                    value: mod.id,
                    label: mod.name,
                  }))}
                  value={modifiers
                    .filter((mod) => (sub.modifiers || []).includes(mod.id))
                    .map((mod) => ({ value: mod.id, label: mod.name }))}
                  onChange={(selected) => {
                    const selectedIds = selected
                      ? selected.map((opt) => opt.value)
                      : [];
                    handleModifierSelect(index, selectedIds);
                  }}
                  placeholder="Select modifiers..."
                />
                <Form.Text>
                  Select one or more modifiers for this item.
                </Form.Text>
              </Form.Group>

              {subCategories.length > 1 && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="mt-3 d-block"
                  onClick={() => removeSubField(index)}
                >
                  Remove Item
                </Button>
              )}
            </div>
          ))}

          {!editData?.isSubCategory && (
            <Button variant="outline-success" onClick={addSubField}>
              + Add Menu Item
            </Button>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            loading ||
            subCategories.some((sub) => !sub.name.trim())
          }
        >
          {loading ? "Saving..." : editData ? "Save Changes" : "Add Category"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddCategoryModal;

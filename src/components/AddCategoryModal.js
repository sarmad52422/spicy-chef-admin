import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import axios from "axios";

const AddCategoryModal = ({ show, onHide, onSave, editData = null }) => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [subCategories, setSubCategories] = useState([
    {
      name: "",
      price: "",
      id: Date.now(),
      image: null,
      description: "",
      variations: [{ name: "", price: "" }],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editData) {
      if (editData.isSubCategory) {
        setCategoryName("");
        setCategoryImage(null);
        setSubCategories([
          {
            name: String(editData.name || ""),
            price: editData.price !== undefined ? String(editData.price) : "",
            id: editData.id || Date.now(),
            image: editData.image || null,
            description: editData.description || "",
            variations: editData.variations || [{ name: "", price: "" }],
          },
        ]);
      } else {
        setCategoryName(String(editData.name || ""));
        setCategoryImage(editData.image || null);
        setSubCategories(
          Array.isArray(editData.subCategories)
            ? editData.subCategories.map((sub) => ({
                name: String(sub.name || ""),
                price: sub.price !== undefined ? String(sub.price) : "",
                id: sub.id || Date.now() + Math.random(),
                image: sub.image || null,
                description: sub.description || "",
                variations: sub.variations || [{ name: "", price: "" }],
              }))
            : [
                {
                  name: "",
                  price: "",
                  id: Date.now(),
                  image: null,
                  description: "",
                  variations: [{ name: "", price: "" }],
                },
              ]
        );
      }
    } else {
      setCategoryName("");
      setCategoryImage(null);
      setSubCategories([
        {
          name: "",
          price: "",
          id: Date.now(),
          image: null,
          description: "",
          variations: [{ name: "", price: "" }],
        },
      ]);
    }
  }, [editData, show]);

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

  const addSubField = () => {
    setSubCategories([
      ...subCategories,
      {
        name: "",
        price: "",
        id: Date.now() + Math.random(),
        image: null,
        description: "",
        variations: [{ name: "", price: "" }],
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
              id: Date.now(),
              image: null,
              description: "",
              variations: [{ name: "", price: "" }],
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
    const hasInvalidSubs = subCategories.some(
      (sc) => sc.name.trim() && !sc.image
    );
    if (hasInvalidSubs) {
      alert("All menu items must have an image");
      return;
    }

    const validSubs = subCategories
      .filter((sc) => sc.name.trim())
      .map((sc) => ({
        name: sc.name.trim(),
        price: sc.price === "" ? 0 : Number(sc.price),
        id: sc.id || Date.now() + Math.random(),
        image: sc.image,
        description: sc.description || "",
        variations: (sc.variations || []).filter(
          (v) => v.name.trim() || v.price
        ),
      }));

    setLoading(true);
    try {
      if (editData?.isSubCategory) {
        await onSave({ ...editData, ...validSubs[0] }, true);
      } else {
        await onSave({
          name: categoryName.trim(),
          image: categoryImage,
          subCategories: validSubs,
        });
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
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e)}
                  disabled={uploading}
                />
              </Form.Group>
            </>
          )}
          <h5>Menu Item</h5>
          {subCategories.map((sub, index) => (
            <div key={sub.id} className="border p-3 rounded mb-4">
              <Row className="mb-2 g-2">
                <Col md={4}>
                  <Form.Control
                    placeholder="Item Name"
                    value={sub.name}
                    onChange={(e) =>
                      handleChangeSub(index, "name", e.target.value)
                    }
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    placeholder="Price"
                    type="number"
                    value={sub.price}
                    onChange={(e) =>
                      handleChangeSub(index, "price", e.target.value)
                    }
                  />
                </Col>
                <Col md={5}>
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

              <Form.Label><strong>Variations</strong></Form.Label>
              {sub.variations.map((v, varIndex) => (
                <Row key={varIndex} className="g-2 mb-2 align-items-center">
                  <Col md={6}>
                    <Form.Control
                      placeholder="Variation Name"
                      value={v.name}
                      onChange={(e) =>
                        handleVariationChange(index, varIndex, "name", e.target.value)
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Control
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) =>
                        handleVariationChange(index, varIndex, "price", e.target.value)
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
            subCategories.some((sub) => !sub.name.trim() || !sub.image)
          }
        >
          {loading ? "Saving..." : editData ? "Save Changes" : "Add Category"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddCategoryModal;
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { addCategory, editCategory } from "../redux/slices/menuSlice";
import axios from "axios";

const AddCategoryModal = ({ show, onHide, onSave, editData = null }) => {
  const dispatch = useDispatch();
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [subCategories, setSubCategories] = useState([
    { name: "", price: "", id: Date.now(), image: null, description: "" },
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
              }))
            : [{ name: "", price: "", id: Date.now(), image: null }]
        );
      }
    } else {
      setCategoryName("");
      setCategoryImage(null);
      setSubCategories([{ name: "", price: "", id: Date.now(), image: null }]);
    }
  }, [editData, show]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await axios.post("https://api.eatmeonline.co.uk/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
          const updated = subCategories.map((sub, i) => {
            if (i === index) {
              return { ...sub, image: url };
            }
            return sub;
          });
          setSubCategories(updated);
        } else {
          setCategoryImage(url);
        }
      }
    }
  };

  const removeImage = (index = null) => {
    if (index !== null) {
      const updated = subCategories.map((sub, i) => {
        if (i === index) {
          return { ...sub, image: null };
        }
        return sub;
      });
      setSubCategories(updated);
    } else {
      setCategoryImage(null);
    }
  };

  const handleChangeSub = (index, field, value) => {
    const updated = subCategories.map((sub, i) => {
      if (i === index) {
        return { ...sub, [field]: value };
      }
      return sub;
    });
    setSubCategories(updated);
  };

  const addSubField = () => {
    setSubCategories([
      ...subCategories,
      { name: "", price: "", id: Date.now() + Math.random(), image: null },
    ]);
  };

  const removeSubField = (index) => {
    console.log("Removing subcategory at index:", index);
    const updated = subCategories.filter((_, i) => i !== index);
    setSubCategories(
      updated.length
        ? updated
        : [{ name: "", price: "", id: Date.now(), image: null }]
    );
  };

  const handleSubmit = async () => {
    if (editData?.isSubCategory) {
      if (!subCategories[0].image) {
        alert("Item image is required");
        return;
      }
      const updatedSub = {
        name: subCategories[0].name.trim(),
        price:
          subCategories[0].price === "" ? 0 : Number(subCategories[0].price),
        id: editData.id,
        image: subCategories[0].image,
        description: subCategories[0].description || "",
      };

      setLoading(true);
      try {
        await onSave({ ...editData, ...updatedSub }, true);
        onHide();
      } finally {
        setLoading(false);
      }
    } else {
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
        }));

      setLoading(true);
      try {
        await onSave({
          name: categoryName.trim(),
          image: categoryImage,
          subCategories: validSubs,
        });
        onHide();
      } finally {
        setLoading(false);
      }
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
            <Form.Group className="d-flex gap-2 align-items-center justify-content-between">
              <Form.Group className="mb-3 w-50">
                <Form.Label>Category Name</Form.Label>
                <Form.Control
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </Form.Group>

              <Form.Group className="mb-3 w-50">
                <Form.Label className="text-end w-100">
                  Category Image URL (Required)
                </Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="text"
                    className="d-none"
                    value={categoryImage || ""}
                    onChange={e => setCategoryImage(e.target.value)}
                    placeholder="Enter image URL"
                    disabled={uploading}
                  />
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileChange(e, null)}
                    disabled={uploading}
                    style={{ width: "auto" }}
                  />
                </div>
              </Form.Group>
            </Form.Group>
          )}

          <Form.Label>
            {editData?.isSubCategory ? "Item Details" : "Menu Items"}
          </Form.Label>

          {subCategories.map((sub, index) => (
            <div key={sub.id} className="mb-3 border p-3 rounded">
              <Row className="g-2 align-items-center">
                <Col md={3}>
                  <Form.Control
                    placeholder="Item name"
                    value={sub.name}
                    onChange={(e) =>
                      handleChangeSub(index, "name", e.target.value)
                    }
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Price"
                    value={sub.price}
                    onChange={(e) =>
                      handleChangeSub(index, "price", e.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </Col>
                <Col md={5}>
                  <Form.Label>Item Image URL (Required)</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="text"
                      value={sub.image || ""}
                      onChange={e => handleChangeSub(index, "image", e.target.value)}
                      placeholder="Enter image URL"
                      required={!editData?.isSubCategory}
                      disabled={uploading}
                      className="d-none"
                    />
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileChange(e, index)}
                      disabled={uploading}
                      style={{ width: "auto" }}
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Item description"
                    value={sub.description || ""}
                    onChange={(e) =>
                      handleChangeSub(index, "description", e.target.value)
                    }
                    className="mt-2"
                  />
                </Col>
                <Col md={2}>
                  {subCategories.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="w-100"
                      onClick={() => removeSubField(index)}
                      disabled={uploading}
                    >
                      Remove item
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
          ))}

          {!editData?.isSubCategory && (
            <Button variant="outline-primary" size="sm" onClick={addSubField}>
              + Add Menu Item
            </Button>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading || uploading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            loading ||
            (!editData?.isSubCategory &&
              subCategories.some((sub) => !sub.image || !sub.name.trim())) ||
            uploading
          }
        >
          {loading || uploading ? "Saving..." : editData ? "Save Changes" : "Add Category"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddCategoryModal;

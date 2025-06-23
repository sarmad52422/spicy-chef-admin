import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { addCategory, editCategory } from "../redux/slices/menuSlice";

const AddCategoryModal = ({ show, onHide, onSave, editData = null }) => {
  const dispatch = useDispatch();
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [subCategories, setSubCategories] = useState([
    { name: "", price: "", id: Date.now(), image: null, description: "" },
  ]);
  const [loading, setLoading] = useState(false);

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

  const handleImageChange = (e, index = null) => {
    const file = e.target.files[0];
    if (file) {
      if (index !== null) {
        const updated = subCategories.map((sub, i) => {
          if (i === index) {
            return { ...sub, image: file };
          }
          return sub;
        });
        setSubCategories(updated);
      } else {
        setCategoryImage(file);
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
                  Category Image (Optional)
                </Form.Label>
                {categoryImage ? (
                  <div className="d-flex align-items-center justify-content-end gap-2 mb-2">
                    <img
                      src={typeof categoryImage === "string" ? categoryImage : URL.createObjectURL(categoryImage)}
                      alt="Preview"
                      style={{
                        width: "75px",
                        height: "auto",
                        objectFit: "cover",
                      }}
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeImage()}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e)}
                  />
                )}
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
                  <Form.Label>Item Image (Required)</Form.Label>
                  {sub.image ? (
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <img
                        src={typeof sub.image === "string" ? sub.image : URL.createObjectURL(sub.image)}
                        alt="Preview"
                        style={{
                          width: "75px",
                          height: "auto",
                          objectFit: "cover",
                        }}
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, index)}
                      required={!editData?.isSubCategory}
                    />
                  )}
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
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            loading ||
            (!editData?.isSubCategory &&
              subCategories.some((sub) => !sub.image || !sub.name.trim()))
          }
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          ) : null}
          {editData ? "Save Changes" : "Add Category"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddCategoryModal;

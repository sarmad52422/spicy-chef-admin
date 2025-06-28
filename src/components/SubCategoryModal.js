import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Image } from 'react-bootstrap';
import axios from 'axios';

const SubCategoryModal = ({ 
  show, 
  onHide, 
  onSave, 
  initialData = null,
  categoryId
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variations, setVariations] = useState([
    { name: '', price: '' },
  ]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPrice(initialData.price !== undefined ? String(initialData.price) : '');
      setDescription(initialData.description || '');
      setPreview(initialData.image || '');
      setVariations(initialData.variations || [{ name: '', price: '' }]);
    } else {
      setName('');
      setPrice('');
      setDescription('');
      setImage(null);
      setPreview('');
      setVariations([{ name: '', price: '' }]);
    }
  }, [initialData, show]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await axios.post('https://api.eatmeonline.co.uk/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status && res.data.result?.data) {
        return res.data.result.data;
      } else {
        alert('Image upload failed');
        return null;
      }
    } catch (err) {
      alert('Image upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setPreview(url);
        setImage(file);
      }
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview('');
  };

  const handleVariationChange = (index, field, value) => {
    const updated = variations.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setVariations(updated);
  };

  const addVariation = () => {
    setVariations([...variations, { name: '', price: '' }]);
  };

  const removeVariation = (index) => {
    const updated = variations.filter((_, i) => i !== index);
    setVariations(updated.length ? updated : [{ name: '', price: '' }]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Item name is required');
      return;
    }
    if (!preview) {
      alert('Item image is required');
      return;
    }

    const payload = {
      name: name.trim(),
      price: price === '' ? '0' : String(price),
      description: description.trim(),
      image: preview,
      category_id: categoryId,
      variations: variations
        .filter(v => v.name.trim())
        .map(v => ({
          name: v.name.trim(),
          price: v.price === '' ? '0' : String(v.price),
        })),
      ...(initialData && initialData.id ? { id: initialData.id } : {}),
    };

    onSave && onSave(payload);
    onHide();
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    onSave && onSave({ deleted: true, id: initialData.id });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {initialData ? 'Edit Menu Item' : 'Add Menu Item'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Control
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Control
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Item description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Item Image (Required)</Form.Label>
            {preview ? (
              <div className="d-flex align-items-center gap-2 mb-2">
                <Image 
                  src={preview} 
                  alt="Preview" 
                  thumbnail 
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                  }} 
                />
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={removeImage}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                <Form.Text className="text-danger">
                  Image is required for menu items
                </Form.Text>
              </>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Variations</Form.Label>
            {variations.map((variation, index) => (
              <Row key={index} className="mb-2 g-2 align-items-center">
                <Col md={6}>
                  <Form.Control
                    placeholder="Variation Name"
                    value={variation.name}
                    onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Control
                    type="number"
                    placeholder="Price"
                    value={variation.price}
                    onChange={(e) => handleVariationChange(index, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </Col>
                <Col md={2}>
                  {variations.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeVariation(index)}
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
              onClick={addVariation}
              className="mt-2"
            >
              + Add Variation
            </Button>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving || uploading}>
          Cancel
        </Button>
        {initialData && initialData.id && (
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={uploading}
          >
            Delete
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || !preview || uploading}
        >
          {uploading ? 'Saving...' : initialData ? 'Save Changes' : 'Add Item'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SubCategoryModal;
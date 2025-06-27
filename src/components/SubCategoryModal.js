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

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPrice(initialData.price !== undefined ? String(initialData.price) : '');
      setDescription(initialData.description || '');
      setPreview(initialData.image || '');
    } else {
      setName('');
      setPrice('');
      setDescription('');
      setImage(null);
      setPreview('');
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

  // Define removeImage function
  const removeImage = () => {
    setImage(null);
    setPreview('');
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
    // Only collect data and call onSave, do not make API calls here
    const payload = {
      name: name.trim(),
      price: price === '' ? '0' : String(price),
      description: description.trim(),
      image: preview,
      category_id: categoryId,
      ...(initialData && initialData.id ? { id: initialData.id } : {}),
    };
    onSave && onSave(payload);
    onHide();
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    // Only notify parent to delete, do not make API call here
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
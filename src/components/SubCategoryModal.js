import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Image } from 'react-bootstrap';

const SubCategoryModal = ({ 
  show, 
  onHide, 
  onSave, 
  initialData = null 
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');

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

  // Define handleImageChange function
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Define removeImage function
  const removeImage = () => {
    setImage(null);
    setPreview('');
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Item name is required');
      return;
    }
    
    if (!preview) {
      alert('Item image is required');
      return;
    }

    onSave({ 
      name: name.trim(), 
      price: price === '' ? 0 : Number(price),
      description: description.trim(),
      image: preview,
      ...(initialData?.id && { id: initialData.id })
    });
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
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || !preview}
        >
          {initialData ? 'Save Changes' : 'Add Item'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SubCategoryModal;
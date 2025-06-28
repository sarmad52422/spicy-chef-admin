import React, { useState } from "react";
import { Modal, Button, Image, Form } from "react-bootstrap";

const VariationSelectModal = ({ show, onHide, options = [], item, onSelect }) => {
  const [selected, setSelected] = useState(null);

  React.useEffect(() => {
    setSelected(null);
  }, [show, item]);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Select Variation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {item && (
          <div className="text-center mb-3">
            {item.image && (
              <Image className="w-100" src={item.image} alt={item.name} style={{height: 240, objectFit: "cover" }} rounded />
            )}
            <h5 className="mt-2">{item.name}</h5>
            {item.description && <div className="text-muted small">{item.description}</div>}
          </div>
        )}
        <Form>
          {options.map((variation, idx) => (
            <Form.Check
              key={variation.name + idx}
              type="radio"
              id={`variation-${idx}`}
              name="variation"
              label={`${variation.name} (£${variation.price})`}
              checked={selected === idx}
              onChange={() => setSelected(idx)}
              className="mb-2"
            />
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (selected !== null) onSelect(options[selected]);
          }}
          disabled={selected === null}
        >
          Add to Cart
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VariationSelectModal; 
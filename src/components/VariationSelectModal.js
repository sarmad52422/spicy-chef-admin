import React, { useState } from "react";
import { Modal, Button, Image, Form } from "react-bootstrap";

const VariationSelectModal = ({ show, onHide, options = [], item, onSelect }) => {
  const [selected, setSelected] = useState(null);
  // { [modifierId]: [optionId, ...] }
  const [selectedModifierOptions, setSelectedModifierOptions] = useState({});

  React.useEffect(() => {
    setSelected(null);
    setSelectedModifierOptions({});
  }, [show, item]);

  // Prepare modifiers from item.itemModifier
  const modifiers = (item?.itemModifier || [])
    .map(im => im.modifier)
    .filter(Boolean);

  // Handler for checkbox change
  const handleModifierOptionChange = (modifierId, optionId, checked) => {
    setSelectedModifierOptions(prev => {
      const prevOptions = prev[modifierId] || [];
      if (checked) {
        return { ...prev, [modifierId]: [...prevOptions, optionId] };
      } else {
        return { ...prev, [modifierId]: prevOptions.filter(id => id !== optionId) };
      }
    });
  };

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
        {/* Modifiers and their options as checkboxes */}
        {modifiers.length > 0 && (
          <div className="mt-3">
            <label><strong>Modifiers</strong></label>
            {modifiers.map(mod => (
              <div key={mod.id} className="mb-2">
                <div className="fw-bold mb-1">{mod.name}</div>
                {(mod.modifierOption || []).map(opt => (
                  <Form.Check
                    key={opt.id}
                    type="checkbox"
                    id={`modopt-${mod.id}-${opt.id}`}
                    label={`${opt.name}${opt.price ? ` (£${opt.price})` : ''}`}
                    checked={(selectedModifierOptions[mod.id] || []).includes(opt.id)}
                    onChange={e => handleModifierOptionChange(mod.id, opt.id, e.target.checked)}
                    className="ms-3"
                  />
                ))}
              </div>
            ))}
            <div className="text-muted small">Select modifier options for this item.</div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (selected !== null) onSelect(options[selected], selectedModifierOptions);
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
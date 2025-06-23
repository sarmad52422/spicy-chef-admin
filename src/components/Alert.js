import React from "react";

export default function Alert({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div
      className={`alert ${type}`}
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        minWidth: 300,
        padding: '10px 20px',
        borderRadius: 4,
        fontWeight: 'bold',
        background: type === 'success' ? '#d4edda' : '#f8d7da',
        color: type === 'success' ? '#155724' : '#721c24',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }}
    >
      {message}
      <button onClick={onClose} style={{ marginLeft: 10, float: 'right', background: 'transparent', border: 'none', fontWeight: 'lighter', fontSize: 18, cursor: 'pointer', color: 'inherit' }}>×</button>
    </div>
  );
} 
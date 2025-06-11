import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FaTrash } from "react-icons/fa";
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
} from "../redux/slices/cartSlice";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

const Checkout = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const [selectedPayment, setSelectedPayment] = useState("cash");

  // Two separate modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const paymentOptions = [
    { id: "cash", label: "Cash" },
    { id: "card", label: "Card" },
    { id: "textToPay", label: "Text to Pay" },
  ];

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      dispatch(removeFromCart(itemToDelete.id));
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleCancelOrder = () => {
    dispatch(clearCart());
    setShowAbandonModal(false);
  };

  return (
    <div
      className="container-fluid px-3"
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <div className="row min-vh-100 align-items-stretch">
        {/* Left: Payment Options */}
        <div className="col-12 col-lg-8 col-md-8 border-end py-4 pe-4">
          <h4>Checkout</h4>
          <div className="mt-4">
            <h5>Select Payment Method</h5>
            <div className="d-flex flex-column gap-3">
              {paymentOptions.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 border rounded ${
                    selectedPayment === option.id
                      ? "border-success bg-light"
                      : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedPayment(option.id)}
                >
                  <strong>{option.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart Summary */}
        <div className="col-12 col-lg-4 col-md-4 py-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="border p-2 mb-2 d-flex align-items-center justify-content-between"
            >
              <div>
                <p className="mb-0">{item.name}</p>
                <small>£ {(item.price * item.quantity).toFixed(2)}</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => dispatch(decrementQuantity(item.id))}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => dispatch(incrementQuantity(item.id))}
                >
                  +
                </button>
                <FaTrash
                  className="text-danger"
                  onClick={() => handleDeleteClick(item)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>
          ))}

          <div className="border-top pt-3 mt-3 total_box">
            <div className="d-flex justify-content-between">
              <strong>Subtotal</strong>
              <span>£ {subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <strong>Total</strong>
              <span>£ {subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-light flex-fill text-danger border"
                onClick={() => setShowAbandonModal(true)}
                disabled={cartItems.length === 0}
              >
                Cancel Order
              </button>
              <button
                className="btn btn-success flex-fill"
                disabled={cartItems.length === 0}
              >
                Order Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for individual item delete */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name}
      />

      {/* Modal for canceling entire order */}
      <DeleteConfirmationModal
        show={showAbandonModal}
        onHide={() => setShowAbandonModal(false)}
        onConfirm={handleCancelOrder}
        itemName="the entire order"
      />
    </div>
  );
};

export default Checkout;

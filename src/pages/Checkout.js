import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FaTrash } from "react-icons/fa";
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
} from "../redux/slices/cartSlice";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const [selectedPayment, setSelectedPayment] = useState("cash");

  // Customer Info States
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");

  // Two separate modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [orderType, setOrderType] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const paymentOptions = [
    { id: "cash", label: "Cash" },
    { id: "card", label: "Card" },
    { id: "textToPay", label: "Text to Pay" },
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const type = localStorage.getItem("orderType") || "";
    setOrderType(type);
  }, []);

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

  const handleOrderNow = async () => {
    setSuccess("");
    setError("");
    // Frontend validation
    if (!fullName.trim()) {
      setError("Full Name is required");
      return;
    }
    if (!mobileNumber.trim()) {
      setError("Mobile Number is required");
      return;
    }
    if (!postcode.trim()) {
      setError("Postcode is required");
      return;
    }
    if (!address.trim()) {
      setError("Address is required");
      return;
    }
    if (!cartItems.length) {
      setError("Cart is empty");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        orderType: orderType || "IN-STORE",
        paymentType: selectedPayment.toUpperCase(),
        fullName,
        address,
        phoneNo: mobileNumber,
        postCode: postcode,
        items: cartItems.map(item => ({ id: item.id, quantity: item.quantity })),
      };
      const res = await fetch("https://api.eatmeonline.co.uk/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        setSuccess("Order placed successfully!");
        dispatch(clearCart());
        navigate("/pending-payments");
      } else {
        setError(data.message || "Failed to place order");
      }
    } catch (err) {
      setError("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid px-3"
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <div className="row min-vh-100 align-items-stretch">
        {/* Left: Customer Info & Payment Options */}
        <div className="col-12 col-lg-8 col-md-8 border-end py-4 pe-4">
          <h4>Checkout</h4>

          {/* Customer Info Fields */}
          <div className="mt-3">
            <h5>Customer Information</h5>
            <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>
            <div className="col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
              <label className="form-label">Postcode</label>
              <input
                type="text"
                className="form-control"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter postcode"
              />
            </div>
            <div className="col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
              />
            </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="mt-4">
            <h5>Select Payment Method</h5>
            <div className="row mt-4">
              {paymentOptions.map((option) => (
                <div className="col-lg-3 col-md-3 col-sm-6 col-12">
                <div
                  key={option.id}
                  className={`p-3 border text-center rounded ${
                    selectedPayment === option.id
                      ? "border-success bg-light"
                      : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedPayment(option.id)}
                >
                  <strong>{option.label}</strong>
                </div>
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
                disabled={cartItems.length === 0 || loading}
                onClick={handleOrderNow}
              >
                {loading ? "Placing Order..." : "Order Now"}
              </button>
            </div>
          </div>

          {success && <div className="alert alert-success mt-2">{success}</div>}
          {error && <div className="alert alert-danger mt-2">{error}</div>}
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
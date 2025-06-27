import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  addCategory,
  deleteCategory,
  editCategory,
  deleteSubCategory,
  editSubCategory,
  addSubCategory,
} from "../redux/slices/menuSlice";
import {
  addToCart,
  removeFromCart,
  clearCart,
  incrementQuantity,
  decrementQuantity,
} from "../redux/slices/cartSlice";
import { FaTrash, FaEdit } from "react-icons/fa";
import AddCategoryModal from "../components/AddCategoryModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SubCategoryModal from "../components/SubCategoryModal";

const LiveOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedBranch = useSelector((state) => state.branch.selectedBranch);
  const cartItems = useSelector((state) => state.cart.items) || [];
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // State for modals and selections
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [subCategoryEditData, setSubCategoryEditData] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    type: null,
    categoryId: null,
    subIndex: null,
  });

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  const fetchCategories = async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/category?branch_id=${selectedBranch.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.status && data.result?.data) {
        setCategories(data.result.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedBranch]);

  const createCategory = async (category) => {
    setLoading(true);
    try {
      const payload = {
        name: category.name,
        image: category.image,
        branch_id: selectedBranch.id,
        items: (category.subCategories || []).map(item => ({
          name: item.name,
          price: String(item.price),
          image: item.image,
          description: item.description,
        })),
      };
      const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        await fetchCategories();
      }
    } catch (err) {}
    setLoading(false);
  };

  const updateCategory = async (category) => {
    setLoading(true);
    try {
      const payload = {
        id: category.id,
        name: category.name,
        image: category.image,
        branch_id: selectedBranch.id,
        items: (category.subCategories || []).map(item => ({
          id: item.id,
          name: item.name,
          price: String(item.price),
          image: item.image,
          description: item.description,
        })),
      };
      const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/category`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        await fetchCategories();
      }
    } catch (err) {}
    setLoading(false);
  };

  const deleteCategoryApi = async (categoryId) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.eatmeonline.co.uk/api/admin/category/${categoryId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        await fetchCategories();
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleBack = () => {
    setSelectedCategoryId(null);
    setEditTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.type === "category") {
      await deleteCategoryApi(deleteModal.categoryId);
      setSelectedCategoryId(null);
    }
    setDeleteModal({
      show: false,
      type: null,
      categoryId: null,
      subIndex: null,
    });
  };

  const handleAddSubCategory = () => {
    setSubCategoryEditData(null);
    setShowSubCategoryModal(true);
  };

  const handleEditSubCategory = (subCategory) => {
    setSubCategoryEditData(subCategory);
    setShowSubCategoryModal(true);
  };

  const handleSaveSubCategory = (data) => {
    if (subCategoryEditData) {
      // Handle edit
      dispatch(
        editSubCategory({
          categoryId: selectedCategoryId,
          subIndex: selectedCategory.subCategories.findIndex(
            (sub) => sub.id === subCategoryEditData.id
          ),
          name: data.name,
          price: data.price,
          id: subCategoryEditData.id, // Preserve existing ID
        })
      );
    } else {
      // Handle add new
      dispatch(
        addSubCategory({
          categoryId: selectedCategoryId,
          subCategory: {
            ...data,
            id: Date.now(),
          },
        })
      );
    }
    setShowSubCategoryModal(false);
    setSubCategoryEditData(null);
  };

  const handleSave = async (data, isEdit = false) => {
    if (isEdit) {
      await updateCategory(data);
    } else {
      await createCategory(data);
    }
    setShowAddModal(false);
    setEditTarget(null);
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const inCat = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const inSub = (cat.item || []).some((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return inCat || inSub;
  });

  return (
    <div
      className="container-fluid px-3"
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <div className="row min-vh-100 align-items-stretch">
        <div className="col-12 col-lg-8 col-md-8 border-end py-4 pe-0">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Live Order Menu</h4>
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search categories or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "250px" }}
              />
              <button
                className="btn btn-dark btn-sm shadow me-2"
                onClick={() => {
                  setEditTarget(null);
                  setShowAddModal(true);
                }}
              >
                Add Food Category
              </button>
            </div>
          </div>

          {selectedCategory ? (
            <>
              <div className="d-flex align-items-center justify-content-between my-5">
                <button
                  className="btn btn-outline-dark shadow-sm"
                  onClick={handleBack}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-outline-success shadow-sm me-2"
                  onClick={handleAddSubCategory}
                >
                  + Add New Item
                </button>
              </div>
              <h5 className="mb-3">{selectedCategory.name}</h5>
              <div className="row">
                {(selectedCategory.item || []).length === 0 ? (
                  <div className="col-12 text-center text-muted py-5">
                    No items found
                  </div>
                ) : (
                  (selectedCategory.item || []).map((item, index) => (
                    <div key={item.id} className="col-6 col-md-4 col-lg-3 mb-3">
                      <div className="border rounded pb-2 text-center shadow card-main position-relative">
                        {item.image && (
                          <div
                            className="w-100 mb-2"
                            style={{ height: "100px", overflow: "hidden" }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        )}
                        <strong className="mt-2 mb-0">{item.name}</strong>
                        <p className="mb-0 text-success">£ {item.price}</p>

                        {/* Add description with ellipsis */}
                        {item.description && (
                          <div
                            className="px-2 mb-2 text-muted"
                            style={{
                              height: "45px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            <small>{item.description}</small>
                          </div>
                        )}

                        <button
                          className="btn btn-outline-dark mt-3"
                          onClick={() => {
                            dispatch(
                              addToCart({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                              })
                            );
                          }}
                        >
                          Add to Cart
                        </button>
                        <div className="hover-icons position-absolute m-1 d-flex gap-2 icons-main">
                          <FaEdit
                            className="text-primary cursor-pointer sub-category-icon"
                            onClick={() => {
                              setEditTarget({
                                ...item,
                                isSubCategory: true,
                                categoryId: selectedCategory.id,
                                subIndex: index,
                              });
                              setShowAddModal(true);
                            }}
                          />
                          <FaTrash
                            className="text-danger cursor-pointer sub-category-icon"
                            onClick={() =>
                              setDeleteModal({
                                show: true,
                                type: "sub",
                                categoryId: selectedCategory.id,
                                subIndex: index,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            categories.length === 0 ? (
              <div className="text-center text-muted py-5">
                No categories found
              </div>
            ) : (
              <div className="menu-main">
                <div className="row">
                  {filteredCategories.map((cat) => (
                    <div key={cat.id} className="col-6 col-md-4 col-lg-3 mb-3">
                      <div
                        className="position-relative border rounded pb-2 text-center shadow card-main d-flex align-items-center justify-content-center category-box flex-wrap"
                        onClick={() => setSelectedCategoryId(cat.id)}
                      >
                        {cat.image && (
                          <div
                            className="w-100 mb-2"
                            style={{ height: "100px", overflow: "hidden" }}
                          >
                            <img
                              src={cat.image}
                              alt={cat.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        )}
                        <p className="mt-2 mb-0 w-100">{cat.name}</p>
                        <button className="btn btn-outline-dark mt-2">
                          View Menu
                        </button>
                        <div
                          className="position-absolute m-1 d-flex gap-2 icons-main"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaEdit
                            className="text-primary cursor-pointer d-hover-inline"
                            onClick={() => {
                              setEditTarget(cat);
                              setShowAddModal(true);
                            }}
                          />
                          <FaTrash
                            className="text-danger cursor-pointer d-hover-inline"
                            onClick={async () => {
                              await deleteCategoryApi(cat.id);
                              setSelectedCategoryId(null);
                              await fetchCategories();
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Cart Section */}
        <div className="col-12 col-lg-4 col-md-4 py-4">
          <div className="item-main">
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
                    className="btn btn-sm btn-outline-secondary custom-cart-btn"
                    onClick={() => dispatch(decrementQuantity(item.id))}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="btn btn-sm btn-outline-secondary custom-cart-btn"
                    onClick={() => dispatch(incrementQuantity(item.id))}
                  >
                    +
                  </button>
                  <FaTrash
                    className="text-danger cursor-pointer"
                    onClick={() => setConfirmDeleteItem(item.id)}
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
                  Abandon Order
                </button>
                <button
                  className="btn btn-success flex-fill"
                  onClick={() => navigate("/checkout")}
                  disabled={cartItems.length === 0}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCategoryModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        editData={editTarget}
      />

      <SubCategoryModal
        show={showSubCategoryModal}
        onHide={() => {
          setShowSubCategoryModal(false);
          setSubCategoryEditData(null);
        }}
        onSave={handleSaveSubCategory}
        initialData={subCategoryEditData}
      />

      <DeleteConfirmationModal
        show={deleteModal.show}
        onHide={() =>
          setDeleteModal({
            show: false,
            type: null,
            categoryId: null,
            subIndex: null,
          })
        }
        onConfirm={handleConfirmDelete}
        itemName={
          deleteModal.type === "category" ? "this category" : "this subcategory"
        }
      />

      <DeleteConfirmationModal
        show={!!confirmDeleteItem}
        onHide={() => setConfirmDeleteItem(null)}
        onConfirm={() => {
          dispatch(removeFromCart(confirmDeleteItem));
          setConfirmDeleteItem(null);
        }}
        itemName="this item"
      />

      <DeleteConfirmationModal
        show={showAbandonModal}
        onHide={() => setShowAbandonModal(false)}
        onConfirm={() => {
          dispatch(clearCart());
          setShowAbandonModal(false);
        }}
        itemName="the entire order"
      />
    </div>
  );
};

export default LiveOrder;
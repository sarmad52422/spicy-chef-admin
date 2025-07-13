import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCategory,
  deleteCategory,
  editCategory,
  deleteSubCategory,
  editSubCategory,
  addSubCategory,
} from "../redux/slices/menuSlice";
import { FaTrash, FaEdit } from "react-icons/fa";
import AddCategoryModal from "../components/AddCategoryModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SubCategoryModal from "../components/SubCategoryModal";
import Alert from "../components/Alert";

const API_BASE_URL = "https://api.eatmeonline.co.uk/api";

const Menu = () => {
  const dispatch = useDispatch();
  const selectedBranch = useSelector((state) => state.branch.selectedBranch);

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
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  const fetchCategories = async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/category?branch_id=${selectedBranch.id}`, {
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

  const handleBack = () => {
    setSelectedCategoryId(null);
    setEditTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.type === "sub") {
      const item = (selectedCategory.item || [])[deleteModal.subIndex];
      if (item && item.id) {
        await deleteItemApi(item.id);
      }
    } else if (deleteModal.type === "category") {
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

  // const handleEditSubCategory = (subCategory) => {
  //   setSubCategoryEditData(subCategory);
  //   setShowSubCategoryModal(true);
  // };

  const handleSaveSubCategory = async (data) => {
    if (subCategoryEditData) {
      await updateItemApi({ ...data, id: subCategoryEditData.id }, selectedCategoryId);
    } else {
      await addItemApi(data, selectedCategoryId);
    }
    setShowSubCategoryModal(false);
    setSubCategoryEditData(null);
  };

  // API helpers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const createCategory = async (category) => {
    setLoading(true);
    try {
      const payload = {
        name: category.name,
        image: category.image, // should be a URL string
        branch_id: selectedBranch.id,
        is_deal: !!category.is_deal, // Always send true or false
        items: (category.subCategories || []).map(item => ({
          name: item.name,
          price: String(item.price),
          image: item.image,
          description: item.description,
          variation: (item.variations || item.variation || []).filter(v => v.name && v.price).map(v => ({
            name: v.name,
            price: String(v.price),
          })),
          modifiers: item.modifiers || [],
        })),
      };
      const res = await fetch(`${API_BASE_URL}/admin/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        setAlert({ type: "success", message: "Category created successfully!" });
        await fetchCategories(); // Refresh category list after creation
      } else {
        let errorMsg = data.message || "Failed to create category";
        if (data.error && Array.isArray(data.error.errors)) {
          errorMsg = data.error.errors.map(e => e.msg).join(" | ");
        }
        setAlert({ type: "error", message: errorMsg });
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
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
          variation: (item.variations || item.variation || []).filter(v => v.name && v.price).map(v => ({
            name: v.name,
            price: String(v.price),
          })),
          modifiers: item.modifiers || [],
        })),
      };
      const res = await fetch(`${API_BASE_URL}/admin/category`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        setAlert({ type: "success", message: "Category updated successfully!" });
        await fetchCategories();
      } else {
        let errorMsg = data.message || "Failed to update category";
        if (data.error && Array.isArray(data.error.errors)) {
          errorMsg = data.error.errors.map(e => e.msg).join(" | ");
        }
        setAlert({ type: "error", message: errorMsg });
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteCategoryApi = async (categoryId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/category/${categoryId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.status) {
        setAlert({ type: "success", message: "Category deleted successfully!" });
        // Optionally refresh categories from API here
      } else {
        throw new Error(data.message || "Failed to delete category");
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const addItemApi = async (item, categoryId) => {
    setLoading(true);
    try {
      const payload = {
        ...item,
        category_id: categoryId,
      };
      const res = await fetch(`${API_BASE_URL}/admin/category/item`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        setAlert({ type: "success", message: "Item added successfully!" });
        await fetchCategories();
      } else {
        setAlert({ type: "error", message: data.message || "Failed to add item" });
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const updateItemApi = async (item, categoryId) => {
    setLoading(true);
    try {
      const payload = {
        ...item,
        category_id: categoryId,
      };
      const res = await fetch(`${API_BASE_URL}/admin/category/item/${item.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status) {
        setAlert({ type: "success", message: "Item updated successfully!" });
        await fetchCategories();
      } else {
        setAlert({ type: "error", message: data.message || "Failed to update item" });
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteItemApi = async (itemId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/category/item/${itemId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.status) {
        setAlert({ type: "success", message: "Item deleted successfully!" });
        await fetchCategories();
      } else {
        setAlert({ type: "error", message: data.message || "Failed to delete item" });
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
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
    const inSub = cat.item.some((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return inCat || inSub;
  });

  return (
    <div className="container-fluid px-3" style={{ minHeight: "100vh" }}>
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({})} />
      <div className="row min-vh-100 align-items-stretch">
        <div className="col-12 py-4 pe-0">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Menu</h4>
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
              <div className="d-flex align-items-center justify-content-between my-2">
                <button className="btn btn-outline-dark shadow-sm" onClick={handleBack}>
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
              <div className="row item-list-main">
                {(selectedCategory.item || []).length === 0 ? (
                  <div className="col-12 text-center text-muted py-5">
                    No items found
                  </div>
                ) : (
                  (selectedCategory.item || []).map((item, index) => (
                    <div key={item.id} className="col-6 col-md-4 col-lg-3 mb-3">
                      <div className="border rounded pb-5 text-center shadow card-main position-relative">
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
                        {/* Show variations if present */}
                        {Array.isArray(item.variation) && item.variation.length > 0 && (
                          <div className="mb-2">
                            <strong>Variations:</strong>
                            <ul className="list-unstyled mb-0">
                              {item.variation.map((v) => (
                                <li key={v.id || v.name}>
                                  <span>{v.name}</span>: <span>£ {v.price}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="hover-icons position-absolute m-1 d-flex gap-2 icons-main">
                          <FaEdit
                            className="text-primary cursor-pointer sub-category-icon"
                            onClick={() => {
                              setEditTarget({
                                ...item,
                                isSubCategory: true,
                                categoryId: selectedCategory.id,
                                subIndex: index,
                                modifiers: Array.isArray(item.itemModifier)
                                  ? item.itemModifier.map(im => im.modifierId)
                                  : [],
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
                            style={{ height: "160px", overflow: "hidden" }}
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
                        <button className="btn btn-outline-dark mt-2">View Menu</button>
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
        categoryId={selectedCategoryId}
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
    </div>
  );
};

export default Menu;
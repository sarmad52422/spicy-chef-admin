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
      dispatch(
        deleteSubCategory({
          categoryId: deleteModal.categoryId,
          subIndex: deleteModal.subIndex,
        })
      );
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

  const handleSaveSubCategory = (data) => {
    if (subCategoryEditData) {
      dispatch(
        editSubCategory({
          categoryId: selectedCategoryId,
          subIndex: (selectedCategory.item || []).findIndex(
            (sub) => sub.id === subCategoryEditData.id
          ),
          name: data.name,
          price: data.price,
          id: subCategoryEditData.id,
        })
      );
    } else {
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
        items: (category.subCategories || []).map(item => ({
          name: item.name,
          price: String(item.price), // ensure price is a string
          image: item.image, // should be a URL string
          description: item.description,
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
      const formData = new FormData();
      formData.append("id", category.id);
      formData.append("name", category.name);
      if (category.image) formData.append("image", category.image);
      // formData.append("branch_id", category.branch_id);
      const items = (category.item || []).map((item) => {
        const { image, ...rest } = item;
        return rest;
      });
      formData.append("items", JSON.stringify(items));
      (category.item || []).forEach((item, idx) => {
        if (item.image) formData.append(`items_images`, item.image);
      });

      const res = await fetch(`${API_BASE_URL}/admin/category`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.status) {
        setAlert({ type: "success", message: "Category updated successfully!" });
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

  const handleSave = async (data, isEdit = false) => {
    // Return a promise so modal can await
    return new Promise(async (resolve) => {
      if (isEdit) {
        if (editTarget?.isSubCategory) {
          dispatch(
            editSubCategory({
              categoryId: selectedCategory.id,
              subIndex: (selectedCategory.item || []).findIndex(
                (sub) => sub.id === editTarget.id
              ),
              name: data.name,
              price: data.price,
              id: editTarget.id,
            })
          );
          resolve();
        } else {
          await updateCategory(data);
          resolve();
        }
      } else {
        if (editTarget?.isSubCategory) {
          const categoryId = editTarget.categoryId || selectedCategoryId;
          dispatch(
            addSubCategory({
              categoryId,
              subCategory: {
                ...data,
                id: Date.now(),
              },
            })
          );
          resolve();
        } else {
          await createCategory(data);
          resolve();
        }
      }
      setShowAddModal(false);
      setEditTarget(null);
    });
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
    <div className="container-fluid px-3" style={{ height: "100vh", overflow: "hidden" }}>
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
              <div className="d-flex align-items-center justify-content-between my-5">
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
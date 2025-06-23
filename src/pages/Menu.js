import React, { useState } from "react";
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

const Menu = () => {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.menu.categories) || [];

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

  const handleBack = () => {
    setSelectedCategoryId(null);
    setEditTarget(null);
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === "sub") {
      dispatch(
        deleteSubCategory({
          categoryId: deleteModal.categoryId,
          subIndex: deleteModal.subIndex,
        })
      );
    } else if (deleteModal.type === "category") {
      dispatch(deleteCategory({ id: deleteModal.categoryId }));
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
          subIndex: selectedCategory.subCategories.findIndex(
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

  const handleSave = (data, isEdit = false) => {
    if (isEdit) {
      if (editTarget?.isSubCategory) {
        dispatch(
          editSubCategory({
            categoryId: selectedCategory.id,
            subIndex: selectedCategory.subCategories.findIndex(
              (sub) => sub.id === editTarget.id
            ),
            name: data.name,
            price: data.price,
            id: editTarget.id,
          })
        );
      } else {
        dispatch(
          editCategory({
            id: data.id,
            name: data.name,
            subCategories: data.subCategories,
          })
        );
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
      } else {
        dispatch(addCategory(data));
      }
    }
    setShowAddModal(false);
    setEditTarget(null);
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const inCat = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const inSub = cat.subCategories.some((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return inCat || inSub;
  });

  return (
    <div className="container-fluid px-3" style={{ height: "100vh", overflow: "hidden" }}>
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
                {selectedCategory.subCategories
                  .filter((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item, index) => (
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
                  ))}
              </div>
            </>
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
                          onClick={() =>
                            setDeleteModal({
                              show: true,
                              type: "category",
                              categoryId: cat.id,
                              subIndex: null,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
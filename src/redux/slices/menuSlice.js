import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    initializeMenu: (state, action) => {
      return action.payload; // or whatever initialization logic you need
    },
    // Initialize with loaded data
    initializeMenu: (state, action) => {
      state.categories = action.payload || [];
    },

    addCategory: (state, action) => {
      state.categories.push({
        id: Date.now(),
        name: action.payload.name,
        image: action.payload.image || null,
        subCategories: (action.payload.subCategories || []).map((sub) => ({
          ...sub,
          id: sub.id || Date.now() + Math.random(),
          price: Number(sub.price) || 0,
        })),
      });
    },

    editCategory: (state, action) => {
      const index = state.categories.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index >= 0) {
        state.categories[index] = {
          ...state.categories[index],
          name: action.payload.name || state.categories[index].name,
          image: action.payload.image ?? state.categories[index].image,
          subCategories: (
            action.payload.subCategories ||
            state.categories[index].subCategories
          ).map((sub) => ({
            ...sub,
            id: sub.id || Date.now() + Math.random(),
            price: Number(sub.price) || 0,
          })),
        };
      }
    },
    deleteCategory: (state, action) => {
      state.categories = state.categories.filter(
        (cat) => cat.id !== action.payload.id
      );
    },
    addSubCategory: (state, action) => {
      const { categoryId, subCategory } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category) {
        category.subCategories.push({
          ...subCategory,
          id: Date.now() + Math.random(),
        });
      }
    },
    editSubCategory: (state, action) => {
      const { categoryId, subIndex, name, price, id, image, description } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category && category.subCategories[subIndex]) {
        category.subCategories[subIndex] = {
          ...category.subCategories[subIndex],
          name: name || category.subCategories[subIndex].name,
          price:
            price !== undefined
              ? price
              : category.subCategories[subIndex].price,
          image:
            image !== undefined
              ? image
              : category.subCategories[subIndex].image,
          id: id || category.subCategories[subIndex].id,
          description: description || category.subCategories[subIndex].description,
        };
      }
    },
    deleteSubCategory: (state, action) => {
      const { categoryId, subIndex } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category) {
        category.subCategories.splice(subIndex, 1);
      }
    },
  },
});

export const {
  initializeMenu,
  addCategory,
  editCategory,
  deleteCategory,
  addSubCategory,
  editSubCategory,
  deleteSubCategory,
} = menuSlice.actions;

export default menuSlice.reducer;

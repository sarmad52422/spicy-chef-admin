import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./slices/menuSlice";
import cartReducer from "./slices/cartSlice";
import branchReducer from "./slices/branchSlice";

// Improved loadState with data validation
const loadState = () => {
  try {
    const serializedState = localStorage.getItem("reduxState");
    if (!serializedState) return undefined;

    const parsed = JSON.parse(serializedState);

    // Validate and normalize the loaded data
    if (parsed?.menu?.categories) {
      parsed.menu.categories = parsed.menu.categories.map((cat) => ({
        ...cat,
        id: cat.id || Date.now(),
        subCategories: (cat.subCategories || []).map((sub) => ({
          ...sub,
          id: sub.id || Date.now() + Math.random(),
          price: Number(sub.price) || 0,
        })),
      }));
    }

    return parsed;
  } catch (err) {
    console.error("Failed to load state:", err);
    return undefined;
  }
};

// Robust saveState function
const saveState = (state) => {
  try {
    // Clone state to avoid mutations
    const stateToPersist = {
      ...state,
      menu: {
        ...state.menu,
        categories: state.menu.categories.map((cat) => ({
          ...cat,
          subCategories: cat.subCategories.map((sub) => ({
            ...sub,
            // Ensure all required fields exist
            id: sub.id || Date.now() + Math.random(),
            name: sub.name || "",
            price: Number(sub.price) || 0,
            image: sub.image || null,
          })),
        })),
      },
    };

    localStorage.setItem("reduxState", JSON.stringify(stateToPersist));
  } catch (err) {
    console.error("Failed to persist state:", err);
  }
};

// Configure store
const store = configureStore({
  reducer: {
    menu: menuReducer,
    cart: cartReducer,
    branch: branchReducer,
  },
  preloadedState: loadState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["menu.categories"],
      },
    }),
});

// Save state on changes with debounce
let saveTimeout;
store.subscribe(() => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveState(store.getState()), 500);
});

export default store;

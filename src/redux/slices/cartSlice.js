// redux/slices/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const { id, name, price, variationId } = action.payload;
      // Use variationId as the unique identifier if present, otherwise fallback to id
      const uniqueId = variationId || id;
      const existing = state.items.find(item => (item.variationId || item.id) === uniqueId);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ id, name, price, quantity: 1, ...(variationId ? { variationId } : {}) });
      }
    },
    incrementQuantity(state, action) {
      const item = state.items.find(i => i.id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementQuantity(state, action) {
      const item = state.items.find(i => i.id === action.payload);
      if (item && item.quantity > 1) item.quantity -= 1;
    },
    removeFromCart(state, action) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
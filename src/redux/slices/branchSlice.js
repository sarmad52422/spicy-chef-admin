// redux/slices/branchSlice.js
import { createSlice } from "@reduxjs/toolkit";

const branchSlice = createSlice({
  name: "branch",
  initialState: {
    selectedBranch: JSON.parse(localStorage.getItem("selectedBranch")) || null,
  },
  reducers: {
    setBranch: (state, action) => {
      state.selectedBranch = action.payload;
      localStorage.setItem("selectedBranch", JSON.stringify(action.payload));
    },
  },
});

export const { setBranch } = branchSlice.actions;
export default branchSlice.reducer;
import { createSlice } from "@reduxjs/toolkit";

const dataSlice = createSlice({
  name: "data",
  initialState: {
    invoices: [],
    products: [],
    customers: [],
  },
  reducers: {
    setInvoices: (state, action) => { state.invoices = action.payload; },
    setProducts: (state, action) => { state.products = action.payload; },
    setCustomers: (state, action) => { state.customers = action.payload; },
  },
});

export const { setInvoices, setProducts, setCustomers } = dataSlice.actions;
export default dataSlice.reducer;
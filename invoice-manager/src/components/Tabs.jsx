import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import InvoiceTable from "./InvoiceTable";
import ProductTable from "./ProductTable";
import CustomerTable from "./CustomerTable";

const AppTabs = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => setValue(newValue);

  return (
    <Box>
      <Tabs value={value} onChange={handleChange} centered>
        <Tab label="Invoices" />
        <Tab label="Products" />
        <Tab label="Customers" />
      </Tabs>
      <Box sx={{ padding: "20px" }}>
        {value === 0 && <InvoiceTable />}
        {value === 1 && <ProductTable />}
        {value === 2 && <CustomerTable />}
      </Box>
    </Box>
  );
};

export default AppTabs;

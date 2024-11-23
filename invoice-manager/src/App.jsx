import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import InvoicesTable from "./components/InvoiceTable";
import ProductsTable from "./components/ProductTable";
import CustomersTable from "./components/CustomerTable";

const App = () => {
  const [data, setData] = useState({ invoices: [], products: [], customers: [] });

  return (
    <div>
      <h1>Automated Data Extraction and Invoice Manager</h1>
      <FileUpload onDataReceived={(uploadedData) =>{
        console.log(uploadedData); 
        setData(uploadedData)}} />

      <h2>Invoices</h2>
      <InvoicesTable invoices={data.invoices} />

      <h2>Products</h2>
      <ProductsTable products={data.products} />

      <h2>Customers</h2>
      <CustomersTable customers={data.customers} />
    </div>
  );
};

export default App;

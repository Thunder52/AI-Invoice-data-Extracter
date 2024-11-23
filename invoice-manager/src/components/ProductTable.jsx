import React from "react";
import { useSelector } from "react-redux";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

const ProductTable = () => {
  const products = useSelector((state) => state.data.products);
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Product Name</TableCell>
          <TableCell>Quantity</TableCell>
          <TableCell>Unit Price</TableCell>
          <TableCell>Tax</TableCell>
          <TableCell>Price with Tax</TableCell>
          <TableCell>Discount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {products.map((product, index) => (
          <TableRow key={index}>
            <TableCell>{product.productName}</TableCell>
            <TableCell>{product.quantity}</TableCell>
            <TableCell>{product.unitPrice}</TableCell>
            <TableCell>{product.tax}</TableCell>
            <TableCell>{product.priceWithTax}</TableCell>
            <TableCell>{product.discount || "N/A"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductTable;
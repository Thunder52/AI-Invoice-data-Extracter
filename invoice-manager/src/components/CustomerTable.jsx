import React from "react";
import { useSelector } from "react-redux";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

const CustomerTable = () => {
  const customers = useSelector((state) => state.data.customers);
  console.log(customers);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Customer Name</TableCell>
          <TableCell>Phone Number</TableCell>
          <TableCell>Total Purchase Amount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {customers.map((customer, index) => (
          <TableRow key={index}>
            <TableCell>{customer.customerName}</TableCell>
            <TableCell>{customer.phoneNumber}</TableCell>
            <TableCell>{customer.totalPurchaseAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CustomerTable;

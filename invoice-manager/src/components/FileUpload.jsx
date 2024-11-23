import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { setInvoices,setProducts,setCustomers } from "../redux/dataSlice";

const FileUpload = ({ onDataReceived }) => {
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch();

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append("filename", file));

    try {
      const response = await axios.post("https://ai-invoice-data-extracter-1.onrender.com/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    //   console.log("Uploaded data:", response.data);

      if (response.data.success) {
        onDataReceived(response.data.data); // Pass data to the parent or other components
        const uploadedData =response.data.data;
        dispatch(setInvoices(uploadedData.invoices));
        dispatch(setProducts(uploadedData.products));
        dispatch(setCustomers(uploadedData.customers));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{ border: "2px dashed #ccc", padding: "20px", marginBottom: "20px" }}
      >
        <input {...getInputProps()} />
        Drag and drop files here, or click to select files.
      </div>
      {uploading && <p>Uploading and processing data...</p>}
    </div>
  );
};

export default FileUpload;

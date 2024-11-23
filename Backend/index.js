import express from "express";
import bodyParser from "body-parser";
import env from 'dotenv';
import multer from "multer";
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from "@google/generative-ai/server";
import {standardSchema} from './Schema.js';
import cors from 'cors';
import XLSX from 'xlsx';
import { parse } from 'json2csv'; 
import path from 'path';
import { fileURLToPath } from 'url';

const app=express();
app.use(cors({ origin:"https://ai-invoice-data-extracter.vercel.app"}));

const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Unsupported file type'), false);
        }
        cb(null, true);
    },
});
env.config();
const genAI = new GoogleGenerativeAI(process.env.SERCER_KEY);
const fileManager = new GoogleAIFileManager(process.env.SERCER_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});
app.use('/uploads', express.static('uploads')); 
app.use(bodyParser.urlencoded({extended:true}));
const promptForFileType = (fileType) => {
    if (fileType.includes('pdf') || fileType.includes('image')) {
        return "Extract invoice, product, and customer details as JSON.";
    } else if (fileType.includes('spreadsheetml')||fileType === 'application/vnd.ms-excel') {
        return "Parse the spreadsheet and extract transaction details, including serial number, total amount, and customer info."
    }
    throw new Error("Unsupported file type for AI processing.");
};
const geminiPrompt = `
You are processing financial documents, including Excel sheets, PDFs, and images of invoices. Extract and organize the data into the following categories:

1. **Invoices**:
   - Serial Number
   - Customer Name
   - Product Name
   - Quantity
   - Tax
   - Total Amount
   - Date

2. **Products**:
   - Product Name
   - Quantity
   - Unit Price
   - Tax
   - Price with Tax
   - Discount (if applicable)

3. **Customers**:
   - Customer Name
   - Phone Number (if available)
   - Total Purchase Amount

**Formatting Requirements**:
- The extracted data should be in JSON format.
- Organize the JSON into three arrays: \`invoices\`, \`products\`, and \`customers\`.
- Example JSON structure:
  {
    "invoices": [
      {
        "serialNumber": "INV-12345",
        "customerName": "John Doe",
        "productName": "Laptop",
        "quantity": 2,
        "tax": 15,
        "totalAmount": 2300,
        "date": "2024-01-01"
      }
    ],
    "products": [
      {
        "productName": "Laptop",
        "quantity": 2,
        "unitPrice": 1000,
        "tax": 15,
        "priceWithTax": 1150,
        "discount": 5
      }
    ],
    "customers": [
      {
        "customerName": "John Doe",
        "phoneNumber": "1234567890",
        "totalPurchaseAmount": 2300
      }
    ]
  }
    If any field is missing or unavailable, return null for that field.
Ensure that the data is validated and accurate.
If multiple invoices contain the same product or customer, ensure that total quantities and purchase amounts are calculated accordinglys
Also if any mathamatical equation is there provide only answer of the equation in the output
ex: if totalAmount is 315-75
then provide totalAmount as 340 
`;

function normalizeAIResponse(response) {
    const normalizedData = JSON.parse(JSON.stringify(standardSchema)); // Deep copy

    const invoices = response.invoices || [];
    normalizedData.invoices = invoices.map((invoice) => ({
        serialNumber: invoice.serialNumber || null,
        customerName: invoice.customerName || null,
        productName: invoice.productName || null,
        quantity: invoice.quantity || 0,
        tax: invoice.tax || 0,
        totalAmount: invoice.totalAmount || 0,
        date: invoice.date || null,
    }));

    // Normalize Products
    const products = response.products || [];
    normalizedData.products = products.map((product) => ({
        productName: product.productName || null,
        quantity: product.quantity || 0,
        unitPrice: product.unitPrice || 0,
        tax: product.tax || 0,
        priceWithTax: product.priceWithTax || 0,
        discount: product.discount || 0,
    }));

    // Normalize Customers
    const customers = response.customers || [];
    normalizedData.customers = customers.map((customer) => ({
        customerName: customer.customerName || null,
        phoneNumber: customer.phoneNumber || null,
        totalPurchaseAmount: customer.totalPurchaseAmount || 0,
    }));

    return normalizedData;
}


// async function processExcelFile(filePath) {
//     try {
//         const workbook = XLSX.readFile(filePath);
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];

//         // Convert sheet to JSON
//         let rawData = XLSX.utils.sheet_to_json(sheet, {
//             defval: null, // Assign null to empty cells
//             raw: false,   // Try to interpret date and number fields automatically
//         });

//         // Filter out metadata and unwanted rows
//         const cleanedData = rawData.filter((row) => {
//             // Ignore rows where 'Serial Number' is null or contains invalid metadata
//             if (
//                 !row['Serial Number'] || // Skip if 'Serial Number' is null
//                 typeof row['Serial Number'] !== 'string' || // Skip invalid strings
//                 row['Serial Number'].toLowerCase().includes('total') // Skip totals/metadata
//             ) {
//                 return false;
//             }
//             return true; // Keep valid rows
//         });

//         // Normalize and map the data
//         const normalizedData = cleanedData.map((row) => ({
//             serialNumber: row['Serial Number'] || null,
//             netAmount: parseFloat(row['Net Amount']) || 0,
//             taxAmount: parseFloat(row['Tax Amount']) || 0,
//             totalAmount: parseFloat(row['Total Amount']) || 0,
//             date: parseExcelDate(row['Date']), // Convert date if valid
//         }));

//         console.log("Extracted and Cleaned Data:", normalizedData);
//         return normalizedData;
//     } catch (error) {
//         throw new Error(`Error processing Excel file: ${error.message}`);
//     }
// }

// // Function to handle Excel's date format
// function parseExcelDate(excelDate) {
//     if (!excelDate) return null;
//     const parsedDate = new Date(excelDate);
//     return !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : null;
// }
const parseExcelToDataFrame = (filePath) => {
    try {
        // Read the Excel file using the XLSX library
        const workbook = XLSX.readFile(filePath);

        // Assume we're working with the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert the worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert JSON data to a DataFrame-like structure
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        const dataFrame = rows.map((row) =>
            headers.reduce((acc, header, index) => {
                acc[header] = row[index] || null;
                return acc;
            }, {})
        );

        return dataFrame;
    } catch (error) {
        throw new Error(`Error processing Excel file: ${error.message}`);
    }
};
app.post("/upload", upload.single("filename"), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileMimeType = req.file.mimetype;
        const originalName = req.file.originalname;

        console.log(fileMimeType);

        let extractedData;
        if (fileMimeType.includes('spreadsheetml') || fileMimeType === 'application/vnd.ms-excel') {
            const jsonData=parseExcelToDataFrame(filePath);
            const csv=parse(jsonData);
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const newFilePAth=path.join(__dirname,'data.csv');
            fs.writeFileSync(newFilePAth,csv);
            const uploadResponse = await fileManager.uploadFile(newFilePAth, {
                mimeType: "text/csv",
                displayName: "DataFrame CSV",
            });
            const result = await model.generateContent([
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri,
                    },
                },
                { text: geminiPrompt },
            ]);
            const content = result.response.text();
            const sanitizedResponse = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .replace(/\\n/g, "\\\\n")
            .trim();
        try {
            extractedData = JSON.parse(sanitizedResponse);
        } catch (error) {
            throw new Error(
                "The AI response is not valid JSON. Raw response: " + content
            );
        }
        const normalizedData=normalizeAIResponse(extractedData);
        console.log(normalizedData);
        res.status(200).json({
            success: true,
            data: normalizedData,
        });

        }else{
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType: fileMimeType,
            displayName: originalName,
        });
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri,
                },
            },
            { text: geminiPrompt },
        ]);

        const content = result.response.text();
        const sanitizedResponse = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .replace(/\\n/g, "\\\\n")
            .trim();
        try {
            extractedData = JSON.parse(sanitizedResponse);
        } catch (error) {
            throw new Error(
                "The AI response is not valid JSON. Raw response: " + content
            );
        }
    
        const normalizedData = normalizeAIResponse(extractedData);
        console.log(extractedData);
        res.status(200).json({
            success: true,
            data: normalizedData,
        });
    }
    
    } catch (error) {
        console.error("Error extracting data:", error);
        res.status(500).json({
            message: "Failed to extract data",
            error: error.message,
        });
    } finally {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Failed to delete file:", err.message);
        });
    }
});
app.listen(3000,()=>{
    console.log("Server is listening on port 3000");
});

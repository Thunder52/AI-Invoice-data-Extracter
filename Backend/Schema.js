const standardSchema = {
    invoices: [
        {
            serialNumber: null,      // Unique identifier for the invoice
            customerName: null,      // Name of the customer
            productName: null,       // Name of the product in the invoice
            quantity: 0,             // Quantity of the product
            tax: 0,                  // Tax applied
            totalAmount: 0,          // Total amount (including tax)
            date: null,              // Date of the invoice
        },
    ],
    products: [
        {
            productName: null,       // Name of the product
            quantity: 0,             // Total quantity of the product
            unitPrice: 0,            // Price per unit
            tax: 0,                  // Tax applied to the product
            priceWithTax: 0,         // Price including tax
            discount: 0,             // Discount applied (if applicable)
        },
    ],
    customers: [
        {
            customerName: null,      // Name of the customer
            phoneNumber: null,       // Customer's phone number (if available)
            totalPurchaseAmount: 0,  // Total amount purchased by the customer
        },
    ],
};
 export {standardSchema};
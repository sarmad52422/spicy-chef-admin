import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import OrderDetails from "./orderDetails";
const ReceiptWrapper = (props) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: 80mm auto; /* Slightly wider for better fit */
        margin: 2mm; /* Small margin to prevent cutoff */
      }
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        font-size: 12px;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .receipt-container {
        width: 76mm; /* 80mm - 2*2mm margin */
        padding: 5px;
        box-sizing: border-box;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 5px 0;
      }
      th, td {
        padding: 3px;
        font-size: 12px;
      }
      th {
        text-align: left;
        background-color: #f8f9fa !important;
      }
      .text-center {
        text-align: center;
      }
      .text-end {
        text-align: right;
      }
      hr {
        border-top: 1px dashed #000;
        margin: 5px 0;
      }
      .dashed-border {
        border-top: 1px dashed #000;
      }
    `,
    removeAfterPrint: true,
    onAfterPrint: () => console.log("Print successful")
  });

  return (
    <div className="d-flex flex-column align-items-center">
      {/* On-screen version (unchanged) */}
      <div className="d-none d-print-block">
        <div ref={componentRef} className="receipt-container">
          <OrderDetails {...props} />
        </div>
      </div>
      
      {/* Print version (only shows when printing) */}
      <div className="d-print-none">
        <OrderDetails {...props} />
        <button 
          className="btn btn-primary mt-3 d-print-none"
          onClick={handlePrint}
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
};

export default ReceiptWrapper;
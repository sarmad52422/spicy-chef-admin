import React, { useRef, useState } from "react";
import OrderDetails from "./orderDetails";
import { useReactToPrint } from "react-to-print";

const ReceiptWrapper = (props) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const printContentRef = useRef();
  const handlePrint = useReactToPrint({
  contentRef: printContentRef,
  pageStyle: `
  @page {
    size: 80mm auto;
    margin: 0;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 80mm !important;
    max-width: 80mm !important;
    height: fit-content !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-weight: normal !important;
    overflow: hidden !important;
  }
  .receipt-container {
    width: 80mm !important;
    max-width: 80mm !important;
    height: fit-content !important;
    margin: 0 !important;
    padding: 0 !important;
    display: inline-block !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  * {
    font-weight: normal !important;
  }
`

});


  // Function to capture all CSS styles
  const getAllStyles = () => {
    let styles = "";

    // Get all stylesheets
    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        Array.from(styleSheet.cssRules || styleSheet.rules).forEach((rule) => {
          styles += rule.cssText + "\n";
        });
      } catch (e) {
        // Handle CORS issues with external stylesheets
        console.log("Could not access stylesheet:", e);
      }
    });

    // Get inline styles
    Array.from(document.querySelectorAll("style")).forEach((style) => {
      styles += style.textContent + "\n";
    });

    return styles;
  };

  // PDF Generation using html2pdf
  const generatePDF = async () => {
    setIsPrinting(true);

    try {
      // Load html2pdf library
      if (!window.html2pdf) {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const element = printContentRef.current;

      const opt = {
        margin: [2, 2, 2, 2], // 2mm margins
        filename: `receipt-${new Date().getTime()}.pdf`,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: {
          unit: "mm",
          format: [80, 200], // 80mm width, auto height
          orientation: "portrait",
          compress: true,
        },
      };

      await window.html2pdf().set(opt).from(element).save();
      setIsPrinting(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try the direct print option.");
      setIsPrinting(false);
    }
  };

  // Direct print with exact styling preservation
  // const handleDirectPrint = () => {
  //   setIsPrinting(true);

  //   setTimeout(() => {
  //     const printWindow = window.open('', '_blank');
  //     const printDocument = printWindow.document;

  //     // Get all existing styles
  //     const allStyles = getAllStyles();

  //     printDocument.write(`
  //       <!DOCTYPE html>
  //       <html>
  //       <head>
  //         <meta charset="UTF-8">
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //         <title>Receipt</title>

  //         <!-- Bootstrap CSS if used -->
  //         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">

  //         <style>
  //           /* All existing styles */
  //           ${allStyles}

  //           /* Print-specific overrides */
  //           @page {
  //             size: 80mm auto;
  //             margin: 0mm;
  //           }

  //           @media print {
  //             body {
  //               margin: 0 !important;
  //               padding: 0 !important;
  //               width: 80mm !important;
  //               background: white !important;
  //               -webkit-print-color-adjust: exact !important;
  //               print-color-adjust: exact !important;
  //             }

  //             .receipt-container {
  //               width: 80mm !important;
  //               max-width: 80mm !important;
  //               margin: 0 !important;
  //               padding: 2mm !important;
  //               box-sizing: border-box !important;
  //             }

  //             * {
  //               visibility: visible !important;
  //               opacity: 1 !important;
  //             }
  //           }

  //           body {
  //             margin: 0;
  //             padding: 0;
  //             width: 80mm;
  //             background: white;
  //             font-family: inherit;
  //           }

  //           .receipt-container {
  //             width: 80mm;
  //             max-width: 80mm;
  //             margin: 0;
  //             padding: 2mm;
  //             box-sizing: border-box;
  //             background: white;
  //           }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="receipt-container">
  //           ${printContentRef.current.innerHTML}
  //         </div>

  //         <script>
  //           window.onload = function() {
  //             setTimeout(() => {
  //               window.print();
  //               setTimeout(() => {
  //                 window.close();
  //               }, 1000);
  //             }, 1000);
  //           };
  //         </script>
  //       </body>
  //       </html>
  //     `);

  //     printDocument.close();
  //     setIsPrinting(false);
  //   }, 100);
  // };

  return (
    <div className="d-flex flex-column align-items-center">
      {/* Hidden exact copy for printing/PDF - same as visible */}

      {/* Visible preview - exact same styling */}
      <div ref={printContentRef} style={{ width: "80mm", maxWidth: "80mm" }}>
        <OrderDetails {...props} />
      </div>

      {/* Control buttons */}
      <div className="d-flex gap-2 mb-2">
        <button
          className="btn btn-success"
          onClick={generatePDF}
          disabled={isPrinting}
          style={{ minWidth: "140px" }}
        >
          {isPrinting ? "📄 Generating..." : "📄 Save as PDF"}
        </button>

        <button
          className="btn btn-primary"
          onClick={handlePrint}
          disabled={isPrinting}
          style={{ minWidth: "140px" }}
        >
          {isPrinting ? "🖨️ Printing..." : "🖨️ Direct Print"}
        </button>
      </div>

      <div className="text-center">
        <small className="text-success">
          ✅ PDF recommended for thermal printers
        </small>
        <br />
        <small className="text-muted">Preview shows exact output</small>
      </div>
    </div>
  );
};

export default ReceiptWrapper;

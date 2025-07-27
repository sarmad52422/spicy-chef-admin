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



  return (
    <div className="d-flex flex-column align-items-center">

      <div ref={printContentRef} style={{ width: "80mm", maxWidth: "80mm" }}>
        <OrderDetails {...props} />
      </div>

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

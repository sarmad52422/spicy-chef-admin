import html2canvas from "html2canvas";
import { generateReceiptHTML } from "../utils/generatePrintRecipt";

function ReceiptPrinter({ data }) {
  const handleCapture = async () => {
    const element = document.getElementById("receipt-preview");

    if (!element) {
      console.error("Receipt element not found");
      return;
    }

    // Convert DOM to canvas
    const canvas = await html2canvas(element, { scale: 2 });
    const imageData = canvas.toDataURL("image/png");

    // Optionally open in new tab
    const win = window.open();
    win.document.writeln(`<img src="${imageData}" />`);
    win.document.close();

    // Or send `imageData` to QZ Tray / printer
  };

  return (
    <>
      {/* Hidden preview */}
      <div
        id="receipt-preview"
        style={{ position: "absolute", left: "-9999px", top: 0 }}
        dangerouslySetInnerHTML={{ __html: generateReceiptHTML(data) }}
      />

      <button onClick={handleCapture}>Convert to Image & Print</button>
    </>
  );
}

export default ReceiptPrinter;

// utils/qzPrint.js
import qz from "qz-tray";
import html2canvas from "html2canvas";

export const connectQZ = async () => {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
};

export const printHTMLWithQZ = async (html) => {
  await connectQZ();

  // 1️⃣ Create hidden container for HTML
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "0";
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  // 2️⃣ Convert HTML to image
  const canvas = await html2canvas(tempDiv, { scale: 2 });
  const imageData = canvas.toDataURL("image/png");

  // 3️⃣ Clean up
  document.body.removeChild(tempDiv);

  // 4️⃣ Get printer list
  const printers = await qz.printers.find();
  console.log("Available printers:", printers);

  const config = qz.configs.create(printers[0], {
    copies: 1,
    margins: 0,
    scaleContent: true
  });

  // 5️⃣ Send image to QZ
  const data = [
    {
      type: "image",
      format: "base64",
      data: imageData.split(",")[1], // strip "data:image/png;base64,"
    },
  ];

  return qz.print(config, data);
};

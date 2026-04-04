import QRCode from "qrcode";

export async function generateQRDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 250,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate a public QR code URL using quickchart.io API.
 * This works in email clients (unlike data URLs which most block).
 */
export async function generateQRDataUrl(data: string): Promise<string> {
  const encoded = encodeURIComponent(data);
  return `https://quickchart.io/qr?text=${encoded}&size=250&margin=2&dark=0a0a0a&light=ffffff`;
}

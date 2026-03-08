/**
 * Open WhatsApp with a pre-filled message
 * @param phone - Phone number (optional, with country code like 919876543210)
 * @param message - Pre-filled message text
 */
export function shareOnWhatsApp(message: string, phone?: string) {
  const encoded = encodeURIComponent(message);
  const url = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank");
}

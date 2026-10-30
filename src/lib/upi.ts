// NPCI UPI intent builder + Indian identifier normalisation. Pure / client-safe.

/**
 * Builds an NPCI-compliant UPI intent deep link (opens GPay / PhonePe / Paytm
 * with payee, amount and note pre-filled). Blueprint §6.2.
 */
export function buildUPILink(vpa: string, payeeName: string, amount: number, invoiceNumber: string): string {
  const params = new URLSearchParams({
    pa: vpa.trim(),
    pn: payeeName.trim().slice(0, 50),
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Inv ${invoiceNumber}`.slice(0, 50),
  });
  return `upi://pay?${params.toString()}`;
}

/** VPA format: handle@psp (e.g. sharmatraders@hdfcbank). */
export function isValidVPA(vpa: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(vpa.trim());
}

/**
 * Normalises Indian mobile numbers to E.164 (+91XXXXXXXXXX).
 * Accepts "98201 12233", "09820112233", "919820112233", "+91-98201-12233".
 * Returns null when the input is not a valid Indian mobile number.
 */
export function normalizeIndianPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length !== 10 || !/^[6-9]/.test(digits)) return null;
  return `+91${digits}`;
}

/** GSTIN: 2-digit state code + PAN (10) + entity no. + 'Z' + checksum. */
export function isValidGSTIN(gstin: string): boolean {
  return /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.trim().toUpperCase());
}

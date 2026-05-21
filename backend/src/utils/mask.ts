// Masking helpers — never expose full identity numbers to the client.

export const maskAadhaar = (aadhaar: string): string => {
  // Show only the last 4 digits, e.g. "XXXX-XXXX-1234"
  if (!aadhaar || aadhaar.length < 4) return "XXXX-XXXX-XXXX";
  const last4 = aadhaar.slice(-4);
  return `XXXX-XXXX-${last4}`;
};

export const maskPan = (pan: string): string => {
  // Show first 3 + last 1, e.g. "ABCXXXXXX1F"
  if (!pan || pan.length < 4) return "XXXXXXXXXX";
  return `${pan.slice(0, 3)}XXXXX${pan.slice(-2)}`;
};

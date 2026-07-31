// Date, currency, and text formatter helpers

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  if (amount == null) return "N/A";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Formats a monetary value in Indian rupees, rounded to whole rupees (no paise).
export const formatINR = (amount) => {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};
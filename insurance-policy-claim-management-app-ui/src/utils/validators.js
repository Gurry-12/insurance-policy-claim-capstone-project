const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isRequired = (value, fieldName = 'This field') =>
  !value || String(value).trim() === '' ? `${fieldName} is required.` : null;

export const isEmail = (value) =>
  EMAIL_RE.test(String(value).toLowerCase()) ? null : 'Enter a valid email address.';

export const isMinLength = (value, min) =>
  String(value).length >= min ? null : `Must be at least ${min} characters.`;

export const isMaxLength = (value, max) =>
  String(value).length <= max ? null : `Must be no more than ${max} characters.`;

export const isPhone = (value) =>
  /^\d{10}$/.test(String(value).trim()) ? null : 'Enter a valid 10-digit phone number.';

// run value through a list of validators, return first error or null
export const validateField = (value, validators = []) => {
  for (const fn of validators) {
    const err = fn(value);
    if (err) return err;
  }
  return null;
};

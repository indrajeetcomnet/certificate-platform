/**
 * Validate an email address.
 * @param {string} value
 * @returns {string|null} Error message or null if valid.
 */
export function email(value) {
  if (!value) return null;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value) ? null : 'Please enter a valid email address';
}

/**
 * Validate that a field is not empty.
 * @param {string} value
 * @param {string} fieldName
 * @returns {string|null}
 */
export function required(value, fieldName = 'This field') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate that a value does not exceed a maximum length.
 * @param {string} value
 * @param {number} max
 * @returns {string|null}
 */
export function maxLength(value, max) {
  if (!value) return null;
  if (String(value).length > max) {
    return `Must be ${max} characters or fewer`;
  }
  return null;
}

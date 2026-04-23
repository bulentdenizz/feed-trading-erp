/**
 * Validation utilities for user inputs and database constraints
 */

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return 'Email cannot be empty';
  }

  if (trimmed.length > 255) {
    return 'Email is too long (max 255 characters)';
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return 'Invalid email format';
  }

  return null;
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 *
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (password.length > 128) {
    return 'Password is too long (max 128 characters)';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }

  return null;
}

/**
 * Validate username (for login)
 * @param username - Username to validate
 * @returns Error message if invalid, null if valid
 */
export function validateUsername(username: string): string | null {
  if (!username || typeof username !== 'string') {
    return 'Username is required';
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (trimmed.length > 50) {
    return 'Username is too long (max 50 characters)';
  }

  // Allow alphanumeric, underscore, hyphen, dot
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return 'Username can only contain letters, numbers, dot, hyphen, or underscore';
  }

  return null;
}

/**
 * Validate entity name (customer/supplier)
 * @param name - Name to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEntityName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return 'Name cannot be empty';
  }

  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters';
  }

  if (trimmed.length > 255) {
    return 'Name is too long (max 255 characters)';
  }

  return null;
}

/**
 * Validate item name (product)
 * @param name - Item name to validate
 * @returns Error message if invalid, null if valid
 */
export function validateItemName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Item name is required';
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return 'Item name cannot be empty';
  }

  if (trimmed.length < 2) {
    return 'Item name must be at least 2 characters';
  }

  if (trimmed.length > 255) {
    return 'Item name is too long (max 255 characters)';
  }

  return null;
}

/**
 * Validate SKU (stock keeping unit)
 * @param sku - SKU to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSku(sku: string): string | null {
  if (!sku || typeof sku !== 'string') {
    return 'SKU is required';
  }

  const trimmed = sku.trim();

  if (trimmed.length === 0) {
    return 'SKU cannot be empty';
  }

  if (trimmed.length > 50) {
    return 'SKU is too long (max 50 characters)';
  }

  // Allow alphanumeric, hyphen, underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return 'SKU can only contain letters, numbers, hyphen, or underscore';
  }

  return null;
}

/**
 * Validate phone number (basic format)
 * @param phone - Phone to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return 'Phone number is required';
  }

  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    return 'Phone number cannot be empty';
  }

  if (trimmed.length > 20) {
    return 'Phone number is too long';
  }

  // Allow digits, spaces, hyphens, plus sign, parentheses
  if (!/^[0-9\s\-+()]+$/.test(trimmed)) {
    return 'Phone number contains invalid characters';
  }

  return null;
}

/**
 * Validate Turkish tax number (VERGI NUMARASI)
 * Format: 10 digits
 * @param taxNumber - Tax number to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTaxNumber(taxNumber: string): string | null {
  if (!taxNumber || typeof taxNumber !== 'string') {
    return 'Tax number is required';
  }

  const trimmed = taxNumber.trim();

  if (trimmed.length !== 10) {
    return 'Tax number must be exactly 10 digits';
  }

  if (!/^\d{10}$/.test(trimmed)) {
    return 'Tax number must contain only digits';
  }

  return null;
}

/**
 * Validate quantity (must be positive number)
 * @param quantity - Quantity to validate
 * @returns Error message if invalid, null if valid
 */
export function validateQuantity(quantity: unknown): string | null {
  let num: number;

  if (typeof quantity === 'string') {
    num = parseFloat(quantity);
  } else if (typeof quantity === 'number') {
    num = quantity;
  } else {
    return 'Quantity must be a valid number';
  }

  if (!Number.isFinite(num)) {
    return 'Quantity must be a valid number';
  }

  if (num <= 0) {
    return 'Quantity must be greater than zero';
  }

  return null;
}

/**
 * Validate date format (ISO 8601)
 * @param dateStr - Date string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateDate(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return 'Date is required';
  }

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    return 'Invalid date format';
  }

  return null;
}

/**
 * Validate date range (from <= to)
 * @param from - Start date (ISO 8601)
 * @param to - End date (ISO 8601)
 * @returns Error message if invalid, null if valid
 */
export function validateDateRange(from: string, to: string): string | null {
  const fromErr = validateDate(from);
  const toErr = validateDate(to);

  if (fromErr) return fromErr;
  if (toErr) return toErr;

  const fromDate = new Date(from).getTime();
  const toDate = new Date(to).getTime();

  if (fromDate > toDate) {
    return 'Start date must be before end date';
  }

  return null;
}

/**
 * Validate transaction type
 * @param type - Transaction type to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTransactionType(
  type: unknown
): string | null {
  const validTypes = [
    'sale',
    'purchase',
    'payment_in',
    'payment_out',
    'sale_return',
    'purchase_return',
  ];

  if (!type || typeof type !== 'string') {
    return 'Transaction type is required';
  }

  if (!validTypes.includes(type)) {
    return `Transaction type must be one of: ${validTypes.join(', ')}`;
  }

  return null;
}

/**
 * Validate entity type
 * @param type - Entity type to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEntityType(type: unknown): string | null {
  const validTypes = ['customer', 'supplier'];

  if (!type || typeof type !== 'string') {
    return 'Entity type is required';
  }

  if (!validTypes.includes(type)) {
    return `Entity type must be one of: ${validTypes.join(', ')}`;
  }

  return null;
}

/**
 * Validate user role
 * @param role - Role to validate
 * @returns Error message if invalid, null if valid
 */
export function validateUserRole(role: unknown): string | null {
  const validRoles = ['admin', 'staff'];

  if (!role || typeof role !== 'string') {
    return 'Role is required';
  }

  if (!validRoles.includes(role)) {
    return `Role must be one of: ${validRoles.join(', ')}`;
  }

  return null;
}

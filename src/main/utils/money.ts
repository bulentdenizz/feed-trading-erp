/**
 * Money utilities — always work with INTEGER cents (kuruş)
 * Display format: en-US locale ("1,234.56")
 */

/**
 * Convert string money value to integer cents
 * Handles formats: "1234.56", "1,234.56", or mixed
 *
 * @param input - Money string or number
 * @returns Integer cents (e.g., 123456 = 1234.56)
 * @throws Error if invalid amount
 */
export function toKurus(input: unknown): number {
  if (input === null || input === undefined) {
    throw new Error('Amount cannot be empty');
  }

  // Convert to string and normalize
  let str = String(input)
    .trim()
    .replace(/\s+/g, ''); // Remove all whitespace

  if (!str) {
    throw new Error('Amount cannot be empty');
  }

  // Handle different decimal separators
  // If there's both comma and dot, determine which is thousands separator
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // Both exist - the last one is the decimal separator
    if (lastComma > lastDot) {
      // European format: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    // Only comma exists - could be thousands OR decimal
    // If comma is at position length-3, it's likely decimal (1,50)
    // Otherwise it's thousands (1,000)
    const isDecimal = str.length - lastComma === 3;
    if (isDecimal) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }
  // If only dot, leave as-is

  const num = parseFloat(str);

  if (!Number.isFinite(num)) {
    throw new Error(`Invalid amount format: "${input}"`);
  }

  if (num < 0) {
    throw new Error('Amount cannot be negative');
  }

  // Convert to cents and round to nearest integer
  const cents = Math.round(num * 100);

  return cents;
}

/**
 * Convert integer cents to formatted money string
 * Format: en-US locale with 2 decimal places
 *
 * @param kurus - Integer cents
 * @param includeCurrency - Add currency symbol (default: true)
 * @returns Formatted string e.g., "1,234.56" or "1,234.56 USD"
 */
export function fromKurus(kurus: number, includeCurrency = false): string {
  if (!Number.isInteger(kurus)) {
    throw new Error('Amount must be an integer (cents)');
  }

  if (kurus < 0) {
    throw new Error('Amount cannot be negative');
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

  const formatted = formatter.format(kurus / 100);

  return includeCurrency ? `${formatted} USD` : formatted;
}

/**
 * Apply basis points to an amount
 * Used for tax calculations, discounts, etc.
 *
 * @param kurus - Base amount in cents
 * @param bps - Basis points (800 = 8%, 1000 = 10%, 2000 = 20%)
 * @returns Calculated amount in cents
 */
export function applyBasisPoints(kurus: number, bps: number): number {
  if (!Number.isInteger(kurus) || !Number.isInteger(bps)) {
    throw new Error('Both values must be integers');
  }

  if (kurus < 0 || bps < 0) {
    throw new Error('Values cannot be negative');
  }

  // Formula: (amount * bps) / 10000
  // Example: (100 * 800) / 10000 = 8 (8% of 100)
  const result = Math.round((kurus * bps) / 10000);

  return result;
}

/**
 * Check if a value is a valid money amount (integer cents)
 *
 * @param value - Value to validate
 * @returns true if valid, false otherwise
 */
export function isValidAmount(value: unknown): boolean {
  if (!Number.isInteger(value)) {
    return false;
  }

  const num = value as number;
  return num >= 0;
}

/**
 * Add two money amounts (handles precision automatically)
 *
 * @param a - First amount in cents
 * @param b - Second amount in cents
 * @returns Sum in cents
 */
export function addKurus(a: number, b: number): number {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error('Both values must be integers (cents)');
  }

  return Math.round(a + b);
}

/**
 * Subtract two money amounts
 *
 * @param a - First amount in cents
 * @param b - Second amount to subtract in cents
 * @returns Difference in cents
 */
export function subtractKurus(a: number, b: number): number {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error('Both values must be integers (cents)');
  }

  const result = a - b;

  if (result < 0) {
    throw new Error('Result cannot be negative');
  }

  return result;
}

/**
 * Multiply money by a factor (e.g., quantity * unit_price)
 *
 * @param kurus - Base amount in cents
 * @param quantity - Multiplier (can be decimal like 2.5 kg)
 * @returns Result in cents
 */
export function multiplyKurus(kurus: number, quantity: number): number {
  if (!Number.isInteger(kurus)) {
    throw new Error('Amount must be an integer (cents)');
  }

  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }

  const result = Math.round(kurus * quantity);

  return result;
}

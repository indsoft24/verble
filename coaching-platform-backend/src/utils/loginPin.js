import crypto from 'crypto';

/** @returns {string} 6-digit numeric login PIN */
export const generateLoginPin = () => crypto.randomInt(100000, 1000000).toString();

export const isValidLoginPinFormat = (pin) => /^\d{6}$/.test(String(pin));

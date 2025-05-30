import crypto from 'crypto';

/**
 * Genera un token único para sesiones de usuario
 * @returns {string} Token único generado
 */
export const generateUniqueToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Calcula la fecha de expiración para un token
 * @param {number} hoursValid Horas de validez del token
 * @returns {Date} Fecha de expiración
 */
export const calculateExpiryDate = (hoursValid = 24) => {
  return new Date(Date.now() + hoursValid * 60 * 60 * 1000);
};

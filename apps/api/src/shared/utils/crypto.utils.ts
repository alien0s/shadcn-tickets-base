import crypto from 'crypto'

/**
 * Gera código numérico de 6 dígitos para 2FA
 */
export function generate2FACode(): string {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Gera token seguro para reset de senha
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Calcula tempo de expiração (em minutos)
 */
export function getExpirationDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}
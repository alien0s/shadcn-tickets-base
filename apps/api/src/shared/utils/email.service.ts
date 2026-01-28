import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'

/**
 * Serviço de envio de emails
 * Usa SMTP configurado nas variáveis de ambiente
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    // Só inicializa se as credenciais existirem
    if (env.email.user && env.email.password) {
      this.transporter = nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        secure: false, // true para porta 465, false para outras
        auth: {
          user: env.email.user,
          pass: env.email.password
        }
      })
    }
  }

  /**
   * Envia email de código 2FA
   */
  async send2FACode(to: string, code: string, userName: string) {
    if (!this.transporter) {
      console.warn('⚠️  Email não configurado, código 2FA:', code)
      return
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .code { font-size: 32px; font-weight: bold; text-align: center; background: white; padding: 20px; border-radius: 8px; letter-spacing: 8px; color: #4F46E5; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Código de Autenticação</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${userName}</strong>,</p>
              <p>Use o código abaixo para completar seu login:</p>
              <div class="code">${code}</div>
              <p>Este código expira em <strong>5 minutos</strong>.</p>
              <p>Se você não solicitou este código, ignore este email.</p>
            </div>
            <div class="footer">
              <p>Sistema de Tickets - Autenticação Segura</p>
            </div>
          </div>
        </body>
      </html>
    `

    await this.transporter.sendMail({
      from: env.email.from,
      to,
      subject: '🔐 Seu Código de Autenticação',
      html
    })
  }

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordResetEmail(to: string, token: string, userName: string) {
    if (!this.transporter) {
      console.warn('⚠️  Email não configurado, token reset:', token)
      return
    }

    const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Recuperação de Senha</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${userName}</strong>,</p>
              <p>Recebemos uma solicitação para redefinir sua senha.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <p>Este link expira em <strong>1 hora</strong>.</p>
              <p>Se você não solicitou a recuperação de senha, ignore este email.</p>
              <p style="font-size: 12px; color: #6b7280;">Ou copie e cole este link no navegador:<br>${resetUrl}</p>
            </div>
            <div class="footer">
              <p>Sistema de Tickets - Recuperação Segura</p>
            </div>
          </div>
        </body>
      </html>
    `

    await this.transporter.sendMail({
      from: env.email.from,
      to,
      subject: '🔑 Recuperação de Senha',
      html
    })
  }
}

// Exportar instância única (singleton)
export const emailService = new EmailService()
import bcrypt from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { AuthRepository } from './auth.repository.js'
import { User, UserPublic, LoginRequest, RegisterRequest } from '@ticket-system/types'
import { UnauthorizedError, ValidationError, NotFoundError } from '../../shared/errors/AppError.js'
import { emailService } from '../../shared/utils/email.service.js'
import { generate2FACode, generateResetToken, getExpirationDate } from '../../shared/utils/crypto.utils.js'

/**
 * Serviço de Autenticação
 * Contém toda a lógica de negócio relacionada à autenticação
 */
export class AuthService {
    private repository: AuthRepository
    private fastify: FastifyInstance
    // Cache em memória para códigos 2FA (em produção, use Redis)
    private twoFactorCodes = new Map<string, { code: string, expiresAt: Date }>()
    /**
 * Extrai nome da role do objeto retornado pelo Supabase
 */
    private getRoleName(user: any): string {
        return user.roles?.name || 'Client'
    }

    constructor(fastify: FastifyInstance) {
        this.repository = new AuthRepository()
        this.fastify = fastify
    }

    /**
     * Busca usuário por ID (método público para usar nas rotas)
     */
    async getUserById(id: string): Promise<User | null> {
        return this.repository.findById(id)
    }
    /**
     * Registra novo usuário no sistema
     */
    async register(registerData: RegisterRequest): Promise<UserPublic> {
        // Validar se email já existe
        const existingUser = await this.repository.findByEmail(registerData.email)
        if (existingUser) {
            throw new ValidationError('Email já cadastrado no sistema')
        }

        // Validar força da senha
        if (registerData.password.length < 8) {
            throw new ValidationError('Senha deve ter no mínimo 8 caracteres')
        }

        // Hash da senha com bcrypt (salt rounds = 10)
        const passwordHash = await bcrypt.hash(registerData.password, 10)

        // Criar usuário no banco
        const user = await this.repository.createUser({
            name: registerData.name,
            last_name: registerData.last_name,
            email: registerData.email,
            password_hash: passwordHash,
            entity_id: registerData.entity_id,
            role_id: registerData.role_id,
            avatar_url: registerData.avatar_url
        })



        // Retornar user sem dados sensíveis
        return this.sanitizeUser(user)
    }

    /**
     * Login do usuário - Etapa 1: Validar credenciais
     * Retorna se precisa de 2FA ou o token direto
     */
    async login(loginData: LoginRequest): Promise<{ user?: UserPublic, token?: string, requires_2fa?: boolean }> {
        // Buscar usuário por email
        const user = await this.repository.findByEmail(loginData.email)

        if (!user || !user.password_hash) {
            throw new UnauthorizedError('Email ou senha incorretos')
        }

        // Verificar se usuário está ativo
        if (!user.is_active) {
            throw new UnauthorizedError('Usuário desativado. Entre em contato com o suporte.')
        }

        // Validar senha
        const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash)

        if (!isPasswordValid) {
            throw new UnauthorizedError('Email ou senha incorretos')
        }

        // Verificar se tem 2FA habilitado
        if (user.two_factor_enabled) {
            // Gerar código de 6 dígitos
            const code = generate2FACode()
            const expiresAt = getExpirationDate(5) // Expira em 5 minutos

            // Armazenar código em memória
            this.twoFactorCodes.set(user.id, { code, expiresAt })

            // Enviar código por email
            await emailService.send2FACode(user.email, code, user.name)

            return {
                requires_2fa: true
            }
        }

        // Atualizar último login
        await this.repository.updateLastLogin(user.id)

        // Retornar token e usuário
        return {
            user: {
                ...this.sanitizeUser(user),
                role_name: this.getRoleName(user)
            },
            token: this.generateToken(user)
        }
    }

    /**
     * Login - Etapa 2: Verificar código 2FA
     */
    async verify2FACode(email: string, code: string): Promise<{ user: UserPublic, token: string }> {
        const user = await this.repository.findByEmail(email)

        if (!user) {
            throw new UnauthorizedError('Usuário não encontrado')
        }

        // Buscar código armazenado
        const storedCode = this.twoFactorCodes.get(user.id)

        if (!storedCode) {
            throw new UnauthorizedError('Código 2FA não encontrado ou expirado')
        }

        // Verificar se código expirou
        if (new Date() > storedCode.expiresAt) {
            this.twoFactorCodes.delete(user.id)
            throw new UnauthorizedError('Código 2FA expirado')
        }

        // Verificar se código está correto
        if (storedCode.code !== code) {
            throw new UnauthorizedError('Código 2FA inválido')
        }

        // Remover código usado
        this.twoFactorCodes.delete(user.id)

        // Atualizar último login
        await this.repository.updateLastLogin(user.id)

        return {
            user: {
                ...this.sanitizeUser(user),
                role_name: this.getRoleName(user)
            },
            token: this.generateToken(user)
        }
    }

    /**
     * Habilitar 2FA para um usuário
     */
    async enable2FA(userId: string): Promise<void> {
        await this.repository.update2FASettings(userId, true)
    }

    /**
     * Desabilitar 2FA para um usuário
     */
    async disable2FA(userId: string): Promise<void> {
        await this.repository.update2FASettings(userId, false)
    }

    /**
     * Solicitar recuperação de senha
     */
    async forgotPassword(email: string): Promise<void> {
        const user = await this.repository.findByEmail(email)

        if (!user) {
            // Não revelar se email existe (segurança)
            return
        }

        // Gerar token de reset
        const resetToken = generateResetToken()
        const expiresAt = getExpirationDate(60) // Expira em 1 hora

        // Salvar no banco
        await this.repository.savePasswordResetToken(user.id, resetToken, expiresAt)

        // Enviar email com link
        await emailService.sendPasswordResetEmail(user.email, resetToken, user.name)
    }

    /**
     * Resetar senha usando token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Buscar usuário pelo token
        const user = await this.repository.findByResetToken(token)

        if (!user) {
            throw new UnauthorizedError('Token inválido ou expirado')
        }

        // Validar nova senha
        if (newPassword.length < 8) {
            throw new ValidationError('Senha deve ter no mínimo 8 caracteres')
        }

        // Hash da nova senha
        const passwordHash = await bcrypt.hash(newPassword, 10)

        // Atualizar senha e limpar token
        await this.repository.updatePassword(user.id, passwordHash)
    }


    /**
     * Login via Microsoft AD (OAuth2)
     * Será implementado quando tiver as credenciais
     */
    async loginWithMicrosoft(microsoftProfile: {
        email: string
        name: string
        avatar?: string
    }): Promise<{ user: UserPublic, token: string }> {
        // Buscar ou criar usuário baseado no email do Microsoft
        const user = await this.repository.findOrCreateMicrosoftUser({
            email: microsoftProfile.email,
            name: microsoftProfile.name,
            avatar_url: microsoftProfile.avatar
        })

        // Atualizar último login
        await this.repository.updateLastLogin(user.id)

        return {
            user: this.sanitizeUser(user),
            token: this.generateToken(user)
        }
    }

    /**
     * Gera JWT token para o usuário
     */
    private generateToken(user: User): string {
        return this.fastify.jwt.sign({
            id: user.id,
            email: user.email,
            entity_id: user.entity_id,
            role_id: user.role_id
        })
    }

    /**
     * Remove dados sensíveis do usuário antes de retornar ao frontend
     */
    private sanitizeUser(user: any): UserPublic {
        return {
            id: user.id,
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            avatar_url: user.avatar_url,
            entity_id: user.entity_id,
            role_id: user.role_id,
            role_name: user.role_name,
            created_at: user.created_at,
            two_factor_enabled: user.two_factor_enabled || false,
            last_login_at: user.last_login_at,
            is_active: user.is_active !== undefined ? user.is_active : true
        }
    }

    /**
 * Retorna dados do usuário com nome da role incluído
 * Usado apenas no login para enviar ao frontend
 */
    private sanitizeUserWithRole(user: any): UserPublic & { role_name: string } {
        return {
            ...this.sanitizeUser(user),
            role_name: user.roles?.name || 'Client'  // ← Pega nome da role do JOIN
        }
    }
}

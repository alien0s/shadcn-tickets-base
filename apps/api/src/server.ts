import { buildApp } from './app.js'
import { env } from './config/env.js'

async function start() {
  try {
    const app = await buildApp()
    await app.listen({ port: env.port, host: env.host })
    
    console.log('🚀 ===================================')
    console.log(`🚀 API rodando em http://localhost:${env.port}`)
    console.log('🚀 ===================================')
    console.log(`📊 Health:        http://localhost:${env.port}/api/health`)
    console.log(`🔐 Auth Login:    http://localhost:${env.port}/api/auth/login`)
    console.log(`👥 Users:         http://localhost:${env.port}/api/users`)
    console.log('🚀 ===================================')
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err)
    process.exit(1)
  }
}

start()
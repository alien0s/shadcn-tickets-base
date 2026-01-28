import { supabase } from './config/supabase.js'

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    
    // Testar uma query simples
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return
    }
    
    console.log('✅ Conexão com Supabase funcionando!')
    console.log('📊 Resposta:', data)
    
  } catch (err) {
    console.error('❌ Erro:', err)
  }
}

testConnection()
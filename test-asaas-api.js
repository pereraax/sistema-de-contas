// Script de teste para verificar a API do Asaas
const API_KEY = process.env.ASAAS_API_KEY || '$aact_YTU5YTE0M2M2N214MTIxNzIkOWYzNzQ0ZDQ1M2NhYw=='
const API_URL = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3'

console.log('🔍 Testando API do Asaas...')
console.log('API URL:', API_URL)
console.log('API Key (primeiros 20 chars):', API_KEY.substring(0, 20) + '...')
console.log('API Key length:', API_KEY.length)

// Testar endpoint de informações da conta
fetch(`${API_URL}/myAccount`, {
  headers: {
    'access_token': API_KEY.trim(),
  },
})
  .then(async (res) => {
    console.log('Status:', res.status)
    const text = await res.text()
    console.log('Resposta:', text.substring(0, 200))
    if (res.ok) {
      console.log('✅ API Key válida!')
    } else {
      console.log('❌ API Key inválida ou erro na requisição')
    }
  })
  .catch((err) => {
    console.error('Erro:', err.message)
  })


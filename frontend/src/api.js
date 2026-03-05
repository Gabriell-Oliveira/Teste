// ============================================
// api.js — Centralizamos todas as chamadas
// para o backend aqui. Assim, se a URL mudar,
// só precisamos alterar em um lugar.
// ============================================
import axios from 'axios'

// URL base do backend. Durante o desenvolvimento
// o Node roda na porta 3001.
const api = axios.create({
  baseURL: 'http://localhost:3001/api'
})

export default api


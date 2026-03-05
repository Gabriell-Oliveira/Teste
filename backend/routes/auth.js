// routes/auth.js
const express = require('express')
const router = express.Router()

// Senha vem do .env
const SENHA = process.env.SENHA_COSTUREIRA || '1234'

router.post('/login', (req, res) => {
  const { senha } = req.body
  if (senha === SENHA) {
    res.json({ sucesso: true, token: 'costureira-autenticada' })
  } else {
    res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta' })
  }
})

module.exports = router

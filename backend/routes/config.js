// routes/config.js
// Rota para configurações globais (chave Pix, etc.)
const express = require('express')
const router = express.Router()

// Arquivo de config simples (pode migrar para MongoDB depois)
const fs = require('fs')
const path = require('path')
const CONFIG_FILE = path.join(__dirname, '../data/config.json')

function lerConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    }
  } catch {}
  return { chavePix: '' }
}

function salvarConfig(dados) {
  const dir = path.dirname(CONFIG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(dados, null, 2))
}

// GET /api/config — retorna configurações públicas
router.get('/', (req, res) => {
  const cfg = lerConfig()
  res.json({ chavePix: cfg.chavePix || '' })
})

// PUT /api/config — atualiza configurações (só costureira)
router.put('/', (req, res) => {
  const cfg = lerConfig()
  const novo = { ...cfg, ...req.body }
  salvarConfig(novo)
  res.json(novo)
})

module.exports = router

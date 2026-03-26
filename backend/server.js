require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const mongoose = require('mongoose')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado!'))
  .catch(err => { console.error('❌ Erro MongoDB:', err.message); process.exit(1) })

app.use('/api/auth',     require('./routes/auth'))
app.use('/api/servicos', require('./routes/servicos'))
app.use('/api/clientes', require('./routes/clientes'))
app.use('/api/pedidos',  require('./routes/pedidos'))
app.use('/api/config',   require('./routes/config'))   // ← NOVO: chave Pix global

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  mongodb: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado'
}))

app.listen(PORT, () => console.log(`🚀 Servidor em http://localhost:${PORT}`))

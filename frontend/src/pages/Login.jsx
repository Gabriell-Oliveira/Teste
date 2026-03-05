import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Login.css'

export default function Login() {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    try {
      const res = await api.post('/auth/login', { senha })
      if (res.data.sucesso) {
        // Salva no localStorage que está autenticada
        localStorage.setItem('costura-auth', 'true')
        navigate('/')
      }
    } catch {
      setErro('Senha incorreta. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">🧵</div>
        <h1>Ateliê Mary</h1>
        <p>Área da costureira</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            autoFocus
          />
          {erro && <p className="erro">{erro}</p>}
          <button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useNavigate, useLocation } from 'react-router-dom'
import './Navbar.css'

const LINKS = [
  { path: '/',             label: '📋 Mural'      },
  { path: '/gerenciamento',label: '📁 Pedidos'    },
  { path: '/clientes',     label: '👥 Clientes'   },
  { path: '/historico',    label: '📦 Histórico'  },
]

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()

  function sair() {
    localStorage.removeItem('costura-auth')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>🧵 Ateliê Mary</div>
      <div className="navbar-links">
        {LINKS.map(l => (
          <button
            key={l.path}
            className={location.pathname === l.path ? 'ativo' : ''}
            onClick={() => navigate(l.path)}
          >
            {l.label}
          </button>
        ))}
        <button className="sair" onClick={sair}>Sair</button>
      </div>
    </nav>
  )
}

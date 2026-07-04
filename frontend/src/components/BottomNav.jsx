import { useLocation, useNavigate } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Inicio', path: '/' },
    { id: 'services', icon: '💆', label: 'Tratamientos', path: '/turnos' },
    { id: 'book', icon: '📅', label: 'Turnos', path: '/turnos' },
  ];

  const isActive = (itemPath) => {
    if (itemPath === '/' && path === '/') return true;
    if (itemPath === '/turnos' && path !== '/') return true;
    return false;
  };

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;

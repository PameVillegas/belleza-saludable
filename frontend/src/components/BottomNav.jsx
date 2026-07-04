import { useLocation, useNavigate } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // No mostrar en login ni en inicio (inicio tiene su propio nav)
  if (path === '/' || path === '/inicio') return null;

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <button className="nav-item" onClick={() => navigate('/inicio')} aria-label="Inicio">
        <span className="nav-icon">🏠</span>
        <span>Inicio</span>
      </button>
      <button className="nav-item" onClick={() => navigate('/turnos')} aria-label="Tratamientos">
        <span className="nav-icon">💆</span>
        <span>Tratamientos</span>
      </button>
      <button className="nav-item" onClick={() => navigate('/mis-turnos')} aria-label="Mis turnos">
        <span className="nav-icon">📋</span>
        <span>Mis turnos</span>
      </button>
    </nav>
  );
}

export default BottomNav;

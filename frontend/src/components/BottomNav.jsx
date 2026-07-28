import { useLocation, useNavigate } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // No mostrar en splash, login ni inicio
  if (path === '/' || path === '/login' || path === '/inicio') return null;

  return (
    <nav className="bottom-nav" aria-label="Navegación">
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ width: '100%', maxWidth: '200px' }}>
        ← Atrás
      </button>
    </nav>
  );
}

export default BottomNav;

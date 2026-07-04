import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');
  const firstName = clientSession?.name?.split(' ')[0] || '';

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const sections = [
    { icon: '💆', label: 'Tratamientos', path: '/turnos' },
    { icon: '📅', label: 'Reservar Turno', path: '/turnos' },
    { icon: '👩‍⚕️', label: 'Profesional', path: '/profesional' },
    { icon: '⭐', label: 'Reseñas', path: '/resenas' },
    { icon: '📋', label: 'Mis Turnos', path: '/mis-turnos' },
    { icon: '📜', label: 'Bases y Condiciones', path: '/bases-condiciones' },
  ];

  return (
    <div className="home-page fade-in">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-left" onClick={() => navigate('/inicio')} style={{ cursor: 'pointer' }}>
          <img src="/logobelleza.jpg" alt="Belleza Saludable" className="home-header-logo" />
          <span className="home-header-name">Belleza Saludable</span>
        </div>
        <button className="home-logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {/* Saludo */}
      <div className="home-greeting">
        <img src="/logobelleza.jpg" alt="Belleza Saludable" className="home-greeting-logo" />
        {firstName && <h2 className="home-greeting-text">Bienvenida, {firstName} ✨</h2>}
        <p className="home-greeting-sub">¿Qué querés hacer hoy?</p>
      </div>

      {/* Grid de secciones */}
      <div className="home-grid">
        {sections.map((item) => (
          <button key={item.label} className="home-grid-item" onClick={() => navigate(item.path)}>
            <span className="home-grid-icon">{item.icon}</span>
            <span className="home-grid-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Info rápida */}
      <div className="home-info-bar">
        <span>📍 Calle 30 N°416</span>
        <span>🕐 Lun a Vie: 9-12 y 14-19hs</span>
      </div>

      {/* Redes */}
      <div className="home-social">
        <a href="https://www.instagram.com/bellezasaludableameghino?igsh=MTduOHVqNGRoNjRuZw==" target="_blank" rel="noopener noreferrer" className="social-btn instagram">📷 Instagram</a>
        <a href="https://wa.me/543388403225" target="_blank" rel="noopener noreferrer" className="social-btn whatsapp">💬 WhatsApp</a>
      </div>
    </div>
  );
}

export default Home;

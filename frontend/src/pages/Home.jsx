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
    { icon: '/iconotratamiento.jpeg', label: 'Tratamientos', path: '/turnos' },
    { icon: '/turno.png', label: 'Reservar Turno', path: '/reservar', highlighted: true },
    { icon: '/iconoproductos.jpeg', label: 'Productos', path: '/productos' },
    { icon: '/iconoderma.png', label: 'Profesional', path: '/profesional' },
    { icon: '/iconoreseña.png', label: 'Reseñas', path: '/resenas' },
    { icon: '/misturnos.png', label: 'Mis Turnos', path: '/mis-turnos' },
    { icon: '📜', label: 'Bases y Condiciones', path: '/bases-condiciones' },
    { icon: '🎁', label: 'Voucher / Gift Card', path: '/voucher' },
  ];

  return (
    <div className="home-page fade-in">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-left" onClick={() => navigate('/inicio')} style={{ cursor: 'pointer' }}>
          <img src="/logobelleza.jpg" alt="Belleza Saludable" className="home-header-logo" />
          <div>
            <span className="home-header-name">Belleza Saludable</span>
            <span className="home-header-tagline">Cosmiatría · Estética · Bienestar</span>
          </div>
        </div>
        <button className="home-logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {/* Banner con saludo */}
      <div className="home-banner">
        <img src="/fotoportada2.png" alt="Belleza Saludable" className="home-banner-img" />
        <div className="home-banner-overlay">
          <div className="home-banner-text">
            {firstName && <h2 className="home-greeting-title">Bienvenida, {firstName} ✨</h2>}
            <p className="home-greeting-subtitle">Un espacio pensado para vos</p>
          </div>
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="home-grid">
        {sections.map((item) => (
          <button key={item.label} className={`home-grid-item ${item.highlighted ? 'highlighted' : ''}`} onClick={() => navigate(item.path)}>
            <span className="home-grid-icon">
              {item.icon.startsWith('/') ? (
                <img src={item.icon} alt={item.label} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', opacity: item.highlighted ? 1 : 0.8 }} />
              ) : (
                item.icon
              )}
            </span>
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

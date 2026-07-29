import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');
  const firstName = clientSession?.name?.split(' ')[0] || '';

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const sections = [
    { bg: '/portadatrata.png', label: 'Tratamientos', path: '/turnos' },
    { bg: '/portadaturno.png', label: 'Reservar Turno', path: '/reservar', highlighted: true },
    { bg: '/portadaproduc.png', label: 'Productos', path: '/productos' },
    { bg: '/portadaprofes.png', label: 'Profesional', path: '/profesional' },
    { bg: '/portadareseñas.png', label: 'Reseñas', path: '/resenas' },
    { bg: '/portadamisturnos.png', label: 'Mis Turnos', path: '/mis-turnos' },
    { bg: '/portadabases.png', label: 'Bases y Condiciones', path: '/bases-condiciones' },
    { bg: '/portadagift.png', label: 'Voucher / Gift Card', path: '/voucher' },
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
          <button
            key={item.label}
            className={`home-grid-item ${item.highlighted ? 'highlighted' : ''}`}
            onClick={() => navigate(item.path)}
            style={item.bg ? { backgroundImage: `url(${item.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            <div className="home-grid-overlay"></div>
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

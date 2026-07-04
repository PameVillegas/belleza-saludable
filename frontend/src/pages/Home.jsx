import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Home() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');
  const firstName = clientSession?.name?.split(' ')[0] || '';

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  const getServiceIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('limpieza')) return '✨';
    if (n.includes('peeling')) return '🧴';
    if (n.includes('microneedling') || n.includes('dermapen')) return '💎';
    if (n.includes('lifting') || n.includes('pestañas')) return '👁️';
    if (n.includes('cejas') || n.includes('perfilado') || n.includes('laminado')) return '✏️';
    if (n.includes('ondas') || n.includes('presoterapia')) return '⚡';
    if (n.includes('lipo')) return '🔥';
    if (n.includes('depilación') || n.includes('depilacion')) return '✂️';
    if (n.includes('cabina') || n.includes('led')) return '💡';
    return '💆';
  };

  return (
    <div className="fade-in">
      {/* Top Nav */}
      <nav className="top-nav">
        <div className="top-nav-logo">
          <img src="/logobelleza.jpg" alt="Belleza Saludable" />
          <span>Belleza Saludable</span>
        </div>
        <div className="top-nav-links">
          <button onClick={() => navigate('/turnos')}>Servicios</button>
          <button onClick={() => navigate('/resenas')}>Testimonios</button>
          <button onClick={() => navigate('/mis-turnos')} className="top-nav-outline">Mis Turnos</button>
          <button onClick={() => navigate('/turnos')} className="top-nav-primary">Reservar Turno</button>
        </div>
      </nav>

      {/* Saludo */}
      {firstName && (
        <div className="greeting-bar">
          ✨ Bienvenida, <strong>{firstName}</strong>
        </div>
      )}

      {/* Hero con imagen */}
      <section className="hero-split">
        <div className="hero-split-text">
          <p className="hero-label">BIENVENIDA A BELLEZA SALUDABLE</p>
          <h1 className="hero-split-title">Realzá tu belleza con tratamientos personalizados</h1>
          <p className="hero-split-sub">Cuidado profesional para que te sientas segura, fresca y radiante todos los días.</p>
          <div className="hero-buttons">
            <button className="hero-btn" onClick={() => navigate('/turnos')}>
              📅 Reservar Turno
            </button>
            <button className="hero-btn-outline" onClick={() => navigate('/turnos')}>
              💆 Tratamientos
            </button>
            <button className="hero-btn-outline" onClick={() => navigate('/resenas')}>
              ⭐ Reseñas
            </button>
          </div>
        </div>
        <div className="hero-split-image">
          <img src="/fotoportada.png" alt="Tratamiento facial profesional" />
        </div>
      </section>

      {/* Badges de confianza */}
      <section className="trust-badges">
        <div className="trust-badge">
          <span className="trust-icon">🎯</span>
          <div>
            <strong>Atención Personalizada</strong>
            <p>Cada tratamiento adaptado a tu piel</p>
          </div>
        </div>
        <div className="trust-badge">
          <span className="trust-icon">✅</span>
          <div>
            <strong>Productos Profesionales</strong>
            <p>Cosmecéutica de alta gama</p>
          </div>
        </div>
        <div className="trust-badge">
          <span className="trust-icon">⭐</span>
          <div>
            <strong>Resultados Comprobados</strong>
            <p>Clientas satisfechas lo avalan</p>
          </div>
        </div>
      </section>

      {/* Servicios destacados */}
      <section className="section">
        <h2 className="section-title">Nuestros tratamientos</h2>
        <p className="section-subtitle">Seleccioná un tratamiento para ver detalles y reservar</p>
        <div className="services-grid">
          {services.map(service => (
            <button
              key={service.id}
              className="service-card"
              onClick={() => navigate(`/servicio/${service.id}`)}
              aria-label={`Ver ${service.name}`}
            >
              <div className="service-icon">{getServiceIcon(service.name)}</div>
              <div className="service-info">
                <div className="service-name">{service.name}</div>
                <div className="service-duration">⏱ {service.duration_minutes} min{Number(service.price) > 0 ? ` · $${Number(service.price).toLocaleString()}` : ' · Consultar'}</div>
              </div>
              <span className="service-arrow">›</span>
            </button>
          ))}
        </div>
        {services.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/turnos')}>
              Ver todos los tratamientos
            </button>
          </div>
        )}
      </section>

      {/* Testimonios */}
      <section className="section section-beige">
        <h2 className="section-title">Lo que dicen nuestras clientas</h2>
        <p className="section-subtitle">Experiencias reales</p>
        <div className="testimonials">
          <div className="testimonial-card fade-up">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Excelente atención, mi piel cambió muchísimo. Se nota la dedicación y el profesionalismo."</p>
            <p className="testimonial-author">— María L.</p>
          </div>
          <div className="testimonial-card fade-up">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Los tratamientos faciales son increíbles. Mariana te explica todo y te hace sentir muy cómoda."</p>
            <p className="testimonial-author">— Carolina P.</p>
          </div>
          <div className="testimonial-card fade-up">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Las ondas rusas y presoterapia cambiaron mi cuerpo. Super recomendable."</p>
            <p className="testimonial-author">— Luciana M.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <span>⭐</span>
            <div><strong>Más de 8 años</strong><p>de experiencia</p></div>
          </div>
          <div className="footer-stat">
            <span>❤️</span>
            <div><strong>Miles de clientas</strong><p>satisfechas</p></div>
          </div>
          <div className="footer-stat">
            <span>✅</span>
            <div><strong>Higiene y seguridad</strong><p>garantizadas</p></div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-info">
            <span>📍 Calle 30 N°416, entre calle 9 y 11</span>
            <span>📱 3388-403225 (WhatsApp)</span>
            <span>🕐 Lunes a Viernes: 9 a 12hs y 14 a 19hs</span>
          </div>
          <div className="footer-social">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Seguinos en</span>
            <a href="https://www.instagram.com/bellezasaludableameghino?igsh=MTduOHVqNGRoNjRuZw==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
            <a href="https://wa.me/543388403225" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

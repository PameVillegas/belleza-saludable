import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Home() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data.slice(0, 8)))
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
    return '💆';
  };

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <img src="/logobelleza.jpg" alt="Belleza Saludable" className="hero-logo" />
          <h1 className="hero-title">Cuidamos tu piel con tratamientos personalizados</h1>
          <p className="hero-subtitle">Cosmetología · Cosmiatría · Dermatocosmiatría</p>
          <button className="hero-btn" onClick={() => navigate('/turnos')}>
            📅 Reservar turno
          </button>
          <div className="hero-info">
            <span>📍 Calle 30 N°416</span>
            <span>🕐 Lun a Vie: 9 a 12hs y 14 a 19hs</span>
          </div>
        </div>
      </section>

      {/* Servicios destacados */}
      <section className="section">
        <h2 className="section-title">Nuestros tratamientos</h2>
        <p className="section-subtitle">Seleccioná un tratamiento para reservar tu turno</p>
        <div className="services-grid">
          {services.map(service => (
            <button
              key={service.id}
              className="service-card"
              onClick={() => {
                sessionStorage.setItem('selectedService', JSON.stringify(service));
                navigate('/fecha-hora');
              }}
              aria-label={`Reservar ${service.name}`}
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
            <p className="testimonial-text">"Excelente atención, mi piel cambió muchísimo. Se nota la dedicación y el profesionalismo en cada sesión."</p>
            <p className="testimonial-author">— María L.</p>
          </div>
          <div className="testimonial-card fade-up">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Los tratamientos faciales son increíbles. Mariana te explica todo y te hace sentir muy cómoda."</p>
            <p className="testimonial-author">— Carolina P.</p>
          </div>
          <div className="testimonial-card fade-up">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Llevo 6 meses con las ondas rusas y presoterapia, los resultados son notorios. Super recomendable."</p>
            <p className="testimonial-author">— Luciana M.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <h3 className="footer-title">Belleza Saludable</h3>
        <div className="footer-info">
          <span>📍 Calle 30 N°416, entre calle 9 y 11</span>
          <span>📱 3388-403225 (WhatsApp)</span>
          <span>🕐 Lunes a Viernes: 9 a 12hs y 14 a 19hs</span>
          <span>🚫 Sábados, domingos y feriados: cerrado</span>
        </div>
        <div className="footer-social">
          <a href="https://wa.me/543388403225" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            💬
          </a>
          <a href="#" aria-label="Instagram">📷</a>
        </div>
      </footer>
    </div>
  );
}

export default Home;

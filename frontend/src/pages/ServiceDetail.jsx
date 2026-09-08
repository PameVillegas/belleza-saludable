import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        const found = data.find(s => s.id === id);
        setService(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Cargando...</div>;
  if (!service) return <div className="booking-container"><div className="error-message">Servicio no encontrado.</div></div>;

  const handleReservar = () => {
    sessionStorage.setItem('selectedService', JSON.stringify(service));
    navigate('/fecha-hora');
  };

  const esPerfilado = /^perfilado\s+de\s+cejas$/i.test((service.name || '').trim());
  const mensajeWhatsApp = 'Hola! Quiero solicitar un turno para Perfilado de Cejas. ¿Qué disponibilidad tenés?';

  return (
    <div className="booking-container fade-up">
      <button className="btn btn-secondary" onClick={() => navigate('/turnos')} style={{ marginBottom: '1.5rem' }}>
        ← Volver
      </button>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 className="booking-title">{service.name}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <span>⏱ {service.duration_minutes} min</span>
          {Number(service.price) > 0
            ? <span>💰 ${Number(service.price).toLocaleString()}</span>
            : <span>💰 Consultar precio</span>
          }
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', background: 'var(--color-beige)' }}>
        <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
          {service.description}
        </p>
      </div>

      {esPerfilado ? (
        <a
          className="btn btn-primary"
          style={{ width: '100%', padding: '1rem' }}
          href={`https://wa.me/543388403225?text=${encodeURIComponent(mensajeWhatsApp)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          📲 Consultar turno
        </a>
      ) : (
        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={handleReservar}>
          📅 Reservar turno
        </button>
      )}
    </div>
  );
}

export default ServiceDetail;

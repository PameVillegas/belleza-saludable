import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';

function SelectService() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los servicios. Intente más tarde.');
        setLoading(false);
      });
  }, []);

  const handleSelect = (service) => {
    sessionStorage.setItem('selectedService', JSON.stringify(service));
    navigate('/fecha-hora');
  };

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

  if (loading) return <div className="loading">Cargando tratamientos...</div>;
  if (error) return <div className="booking-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="booking-container fade-up">
      <Stepper currentStep={1} />
      <div className="booking-header">
        <h2 className="booking-title">Elegí un tratamiento</h2>
        <p className="booking-subtitle">Seleccioná el servicio que querés reservar</p>
      </div>
      <div className="services-grid" style={{ gridTemplateColumns: '1fr' }}>
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
              <div className="service-duration">
                ⏱ {service.duration_minutes} min
                {Number(service.price) > 0
                  ? ` · $${Number(service.price).toLocaleString()}`
                  : ' · Consultar precio'}
              </div>
            </div>
            <span className="service-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SelectService;

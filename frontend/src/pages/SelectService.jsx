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

  if (loading) return <div className="loading">Cargando tratamientos...</div>;
  if (error) return <div className="booking-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="booking-container fade-up">
      <Stepper currentStep={1} />
      <div className="booking-header">
        <h2 className="booking-title">Elegí un tratamiento</h2>
        <p className="booking-subtitle">Seleccioná el servicio que querés reservar</p>
      </div>
      <div className="treatments-grid">
        {services.map(service => (
          <div
            key={service.id}
            className="treatment-card"
            onClick={() => navigate(`/servicio/${service.id}`)}
          >
            {service.image_url ? (
              <img src={service.image_url} alt={service.name} className="treatment-card-img" />
            ) : (
              <div className="treatment-card-placeholder">
                💆
              </div>
            )}
            <div className="treatment-card-body">
              <h3 className="treatment-card-name">{service.name}</h3>
              <div className="treatment-card-meta">
                <span>⏱ {service.duration_minutes} min</span>
                <span>
                  {Number(service.price) > 0
                    ? `$${Number(service.price).toLocaleString()}`
                    : 'Consultar'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectService;

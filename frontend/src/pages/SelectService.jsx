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

  if (loading) return <div className="loading">Cargando servicios...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <Stepper currentStep={1} />
      <h2 style={{ marginBottom: '1rem' }}>Elegí un servicio</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {services.map(service => (
          <button
            key={service.id}
            className="card"
            onClick={() => handleSelect(service)}
            style={{ cursor: 'pointer', textAlign: 'left', width: '100%', border: '1px solid var(--color-border)' }}
            aria-label={`Seleccionar ${service.name}`}
          >
            <h3>{service.name}</h3>
            {service.description && (
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {service.description}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <span>⏱ {service.duration_minutes} min</span>
              <span style={{ fontWeight: '600' }}>${Number(service.price).toLocaleString()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SelectService;

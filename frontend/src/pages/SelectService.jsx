import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SelectService() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
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

  const filtered = services.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Cargando tratamientos...</div>;
  if (error) return <div className="booking-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="treatments-page fade-up">
      <div className="treatments-header">
        <h2 className="treatments-title">Nuestros Tratamientos</h2>
        <p className="treatments-subtitle">Conocé todos los servicios que ofrecemos</p>
      </div>

      <div className="treatments-search">
        <input
          type="text"
          placeholder="Buscar tratamiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="treatments-search-input"
        />
      </div>

      <div className="treatments-grid">
        {filtered.map(service => (
          <div key={service.id} className="treatment-card-v2">
            <div className="treatment-card-v2-img-wrap">
              {service.image_url ? (
                <img src={service.image_url} alt={service.name} className="treatment-card-v2-img" />
              ) : (
                <div className="treatment-card-v2-placeholder">💆</div>
              )}
            </div>
            <div className="treatment-card-v2-body">
              <h3 className="treatment-card-v2-name">{service.name}</h3>
              <div className="treatment-card-v2-info">
                <span className="treatment-card-v2-duration">⏱ {service.duration_minutes} min</span>
                <span className="treatment-card-v2-price">
                  {Number(service.price) > 0
                    ? `$${Number(service.price).toLocaleString()}`
                    : 'Consultar'}
                </span>
              </div>
              <button
                className="treatment-card-v2-btn"
                onClick={() => navigate(`/servicio/${service.id}`)}
              >
                Ver detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 0' }}>No se encontraron tratamientos.</p>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default SelectService;

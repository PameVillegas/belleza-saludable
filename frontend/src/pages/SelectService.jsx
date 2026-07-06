import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'facial',
    label: 'Faciales',
    description: 'Salud y renovación cutánea. Tratamientos diseñados para restaurar la eudermia, mejorar la textura y abordar inesteticismos específicos.',
    icon: '🩷'
  },
  {
    id: 'corporal',
    label: 'Corporales',
    description: 'Remodelación y bienestar. Tecnología enfocada en la tonificación, el drenaje y el tratamiento de la adiposidad localizada.',
    icon: '🩷'
  },
  {
    id: 'depilacion',
    label: 'Depilación',
    description: 'Tecnología de vanguardia para la eliminación progresiva del vello.',
    icon: '🩷'
  }
];

function getCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('ondas rusas') || n.includes('presoterapia') || n.includes('lipoláser') || n.includes('lipolaser') || n.includes('lipolá')) return 'corporal';
  if (n.includes('depilación') || n.includes('depilacion')) return 'depilacion';
  return 'facial';
}

function SelectService() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
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
        setError('No se pudieron cargar los servicios.');
        setLoading(false);
      });
  }, []);

  const filtered = services.filter(s => {
    if (!activeCategory) return false;
    const matchCat = getCategory(s.name) === activeCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return <div className="loading">Cargando tratamientos...</div>;
  if (error) return <div className="booking-container"><div className="error-message">{error}</div></div>;

  // Vista de categorías (sin categoría seleccionada)
  if (!activeCategory) {
    return (
      <div className="treatments-page fade-up">
        <div className="treatments-header">
          <h2 className="treatments-title">Nuestros Tratamientos</h2>
          <p className="treatments-subtitle">Profesionalismo y biotecnología al servicio de tu piel</p>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#9CA3AF', textAlign: 'center', marginBottom: '1.5rem', lineHeight: '1.5', padding: '0 0.5rem' }}>
          Todos los tratamientos están sujetos a una evaluación previa para determinar el protocolo más adecuado según el biotipo cutáneo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className="treatment-category-card"
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="treatment-category-icon">{cat.icon}</span>
              <div className="treatment-category-info">
                <h3 className="treatment-category-name">{cat.label}</h3>
                <p className="treatment-category-desc">{cat.description}</p>
              </div>
              <span className="treatment-category-arrow">›</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Vista de servicios dentro de una categoría
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="treatments-page fade-up">
      <div className="treatments-header">
        <h2 className="treatments-title">{currentCat.icon} {currentCat.label}</h2>
        <p className="treatments-subtitle">{currentCat.description}</p>
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
                <div className="treatment-card-v2-placeholder">{currentCat.icon}</div>
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
        <button className="btn btn-secondary" onClick={() => setActiveCategory(null)}>
          ← Volver a categorías
        </button>
      </div>
    </div>
  );
}

export default SelectService;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'facial',
    label: 'Faciales',
    description: 'Salud y renovación cutánea. Tratamientos diseñados para restaurar la eudermia, mejorar la textura y abordar inesteticismos específicos.',
    icon: '🩷',
    image: '/facial.jpg'
  },
  {
    id: 'corporal',
    label: 'Corporales',
    description: 'Remodelación y bienestar. Tecnología enfocada en la tonificación, el drenaje y el tratamiento de la adiposidad localizada.',
    icon: '🩷',
    image: '/corp.png'
  },
  {
    id: 'depilacion',
    label: 'Depilación',
    description: 'Tecnología de vanguardia para la eliminación progresiva del vello.',
    icon: '🩷',
    image: '/dep.jpg'
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
      <main className="treatments-page fade-up" id="main-content">
        <div className="treatments-header">
          <h1 className="treatments-title">Nuestros Tratamientos</h1>
          <p className="treatments-subtitle">Profesionalismo y biotecnología al servicio de tu piel</p>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#9CA3AF', textAlign: 'center', marginBottom: '1.5rem', lineHeight: '1.5', padding: '0 0.5rem' }}>
          Todos los tratamientos están sujetos a una evaluación previa para determinar el protocolo más adecuado según el biotipo cutáneo.
        </p>

        <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              role="listitem"
              className="treatment-category-card"
              onClick={() => setActiveCategory(cat.id)}
              aria-label={`Ver tratamientos: ${cat.label} — ${cat.description}`}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <img src={cat.image} alt="" role="presentation" className="treatment-category-img" />
              <div className="treatment-category-info">
                <h2 className="treatment-category-name">{cat.label}</h2>
                <p className="treatment-category-desc">{cat.description}</p>
              </div>
              <span className="treatment-category-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
            ← Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  // Vista de servicios dentro de una categoría
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <main className="treatments-page fade-up" id="main-content">
      <div className="treatments-header">
        <h1 className="treatments-title"><span aria-hidden="true">{currentCat.icon}</span> {currentCat.label}</h1>
        <p className="treatments-subtitle">{currentCat.description}</p>
      </div>

      <div className="treatments-search">
        <label htmlFor="treatment-search" className="sr-only">Buscar tratamiento</label>
        <input
          id="treatment-search"
          type="search"
          placeholder="Buscar tratamiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="treatments-search-input"
          aria-label="Buscar tratamiento"
        />
      </div>

      <div className="treatments-grid" role="list" aria-label={`Tratamientos de ${currentCat.label}`}>
        {filtered.map(service => (
          <div key={service.id} className="treatment-card-v2" role="listitem">
            <div className="treatment-card-v2-img-wrap">
              {service.image_url ? (
                <img src={service.image_url} alt={service.name} className="treatment-card-v2-img" />
              ) : (
                <div className="treatment-card-v2-placeholder" aria-hidden="true">{currentCat.icon}</div>
              )}
            </div>
            <div className="treatment-card-v2-body">
              <h2 className="treatment-card-v2-name">{service.name}</h2>
              <div className="treatment-card-v2-info">
                <span className="treatment-card-v2-duration"><span aria-hidden="true">⏱</span> {service.duration_minutes} min</span>
                <span className="treatment-card-v2-price">
                  {Number(service.price) > 0
                    ? `$${Number(service.price).toLocaleString()}`
                    : 'Consultar'}
                </span>
              </div>
              <button
                className="treatment-card-v2-btn"
                onClick={() => navigate(`/servicio/${service.id}`)}
                aria-label={`Ver detalles de ${service.name}`}
              >
                Ver detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 0' }} role="status">No se encontraron tratamientos.</p>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => setActiveCategory(null)} aria-label="Volver a categorías de tratamientos">
          ← Volver a categorías
        </button>
      </div>
    </main>
  );
}

export default SelectService;

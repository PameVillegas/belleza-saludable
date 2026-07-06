import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Todos', 'Limpieza', 'Hidratación', 'Anti-age', 'Protección solar', 'Sérums'];

function getCategory(name, description) {
  const text = (name + ' ' + (description || '')).toLowerCase();
  if (text.includes('micelar') || text.includes('limpi')) return 'Limpieza';
  if (text.includes('hidrat') || text.includes('máscara') || text.includes('mascara')) return 'Hidratación';
  if (text.includes('anti-age') || text.includes('contorno') || text.includes('retinol') || text.includes('péptido')) return 'Anti-age';
  if (text.includes('solar') || text.includes('fps') || text.includes('protector')) return 'Protección solar';
  if (text.includes('sérum') || text.includes('serum') || text.includes('vitamina c')) return 'Sérums';
  return 'Hidratación';
}

function getBadge(name) {
  const n = name.toLowerCase();
  if (n.includes('sérum') || n.includes('vitamina c')) return 'Más vendido';
  if (n.includes('protector') || n.includes('solar')) return 'Recomendado';
  if (n.includes('contorno')) return 'Nuevo';
  return null;
}

function getBenefits(name, description) {
  const text = (name + ' ' + (description || '')).toLowerCase();
  const benefits = [];
  if (text.includes('hidrat')) benefits.push('💧 Hidratación profunda');
  if (text.includes('sensible') || text.includes('suave')) benefits.push('🌸 Piel sensible');
  if (text.includes('fps') || text.includes('solar')) benefits.push('☀️ Protección UV');
  if (text.includes('antioxidant') || text.includes('vitamina c')) benefits.push('✨ Antioxidante');
  if (text.includes('retinol') || text.includes('anti-age') || text.includes('arrugas')) benefits.push('🔬 Anti-age');
  if (text.includes('ilumina') || text.includes('luminosidad')) benefits.push('💎 Luminosidad');
  if (text.includes('limpi') || text.includes('remueve')) benefits.push('🧼 Limpieza suave');
  if (text.includes('repara') || text.includes('nutre')) benefits.push('🌿 Reparador');
  return benefits.slice(0, 3);
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los productos.');
        setLoading(false);
      });
  }, []);

  const handleBuy = (product) => {
    const clientName = clientSession?.name || 'Un cliente';
    const message = `Hola! Soy ${clientName} y quiero consultar por el producto: *${product.name}*. ¿Está disponible?`;
    const url = `https://wa.me/543388403225?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'Todos' || getCategory(p.name, p.description) === activeFilter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="loading">Cargando productos...</div>;
  if (error) return <div className="booking-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="products-page fade-up">
      {/* Header */}
      <div className="products-header">
        <h2 className="products-title">Productos</h2>
        <p className="products-subtitle">Productos recomendados para tu cuidado facial</p>
      </div>

      {/* Buscador */}
      <div className="products-search">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="products-search-input"
        />
      </div>

      {/* Filtros */}
      <div className="products-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`products-filter-btn ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#9CA3AF' }}>No se encontraron productos.</p>
        </div>
      )}

      <div className="products-grid">
        {filtered.map(product => {
          const category = getCategory(product.name, product.description);
          const badge = getBadge(product.name);
          const benefits = getBenefits(product.name, product.description);

          return (
            <div key={product.id} className="product-card">
              {badge && <span className="product-badge">{badge}</span>}
              <div className="product-card-top"></div>
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="product-card-img" />
              )}
              <div className="product-card-body">
                <span className="product-category">{category}</span>
                <h3 className="product-name">{product.name}</h3>

                {benefits.length > 0 && (
                  <div className="product-benefits">
                    {benefits.map((b, i) => (
                      <span key={i} className="product-benefit">{b}</span>
                    ))}
                  </div>
                )}

                <div className="product-footer">
                  <button className="product-buy-btn" onClick={() => handleBuy(product)}>
                    Consultar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default Products;

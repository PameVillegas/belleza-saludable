import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  if (loading) return <div className="loading">Cargando productos...</div>;
  if (error) return <div className="booking-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="booking-container fade-up">
      <div className="booking-header">
        <h2 className="booking-title">🧴 Productos</h2>
        <p className="booking-subtitle">Cremas y productos disponibles</p>
      </div>

      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>No hay productos disponibles por el momento.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {products.map(product => (
          <div key={product.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                {product.name}
              </h3>
              {product.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                  {product.description}
                </p>
              )}
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-sage-dark)' }}>
                ${Number(product.price).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default Products;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Reviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  const [formData, setFormData] = useState({
    stars: 5,
    service_name: '',
    text: ''
  });

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientSession?.name || 'Anónimo',
          service_name: formData.service_name,
          stars: formData.stars,
          text: formData.text
        })
      });

      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setSuccess(true);
        setFormData({ stars: 5, service_name: '', text: '' });
        setShowForm(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Error al enviar la reseña.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="loading">Cargando reseñas...</div>;

  return (
    <div className="booking-container fade-up">
      <div className="booking-header">
        <h2 className="booking-title">⭐ Reseñas</h2>
        <p className="booking-subtitle">Lo que dicen nuestras clientas</p>
      </div>

      {/* Botón para escribir reseña */}
      {clientSession && !showForm && (
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{ width: '100%', marginBottom: '1.5rem' }}
        >
          ✍️ Escribir mi reseña
        </button>
      )}

      {/* Mensaje de éxito */}
      {success && (
        <div className="success-message" style={{ marginBottom: '1rem' }}>
          ✓ ¡Gracias por tu reseña! Ya está publicada.
        </div>
      )}

      {/* Formulario de reseña */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>
            Tu experiencia
          </h3>
          <form onSubmit={handleSubmit}>
            {/* Estrellas */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.4rem' }}>
                Puntuación
              </label>
              <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setFormData({ ...formData, stars: star })}
                    style={{ cursor: 'pointer', color: star <= formData.stars ? 'var(--color-gold)' : '#ddd' }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Servicio */}
            <div className="form-group">
              <label>Servicio (opcional)</label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="Ej: Limpieza Facial, Lifting de Pestañas..."
              />
            </div>

            {/* Texto */}
            <div className="form-group">
              <label>Tu comentario</label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Contanos tu experiencia..."
                rows="3"
                required
                minLength="10"
                style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Publicar reseña'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de reseñas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reviews.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
            Todavía no hay reseñas. ¡Sé la primera en dejar la tuya!
          </p>
        )}
        {reviews.map((review) => (
          <div key={review.id} className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--color-gold)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
            </div>
            <p style={{ fontSize: '0.88rem', fontStyle: 'italic', lineHeight: '1.5', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
              "{review.text}"
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>— {review.client_name}</span>
              <span>{review.service_name || ''}{review.created_at ? ` · ${formatDate(review.created_at)}` : ''}</span>
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

export default Reviews;

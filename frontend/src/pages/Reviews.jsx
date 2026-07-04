import { useNavigate } from 'react-router-dom';

function Reviews() {
  const navigate = useNavigate();

  // Por ahora reseñas estáticas hasta que se implemente el backend de reseñas
  const reviews = [
    { stars: 5, text: 'Excelente atención, mi piel cambió muchísimo. Se nota la dedicación y el profesionalismo en cada sesión.', author: 'María L.', service: 'Limpieza Facial Profunda' },
    { stars: 5, text: 'Los tratamientos faciales son increíbles. Mariana te explica todo y te hace sentir muy cómoda.', author: 'Carolina P.', service: 'Peelings Químicos' },
    { stars: 5, text: 'Llevo 6 meses con las ondas rusas y presoterapia, los resultados son notorios. Super recomendable.', author: 'Luciana M.', service: 'Ondas Rusas + Presoterapia' },
    { stars: 5, text: 'El microneedling me cambió la piel por completo. Las marcas de acné se redujeron muchísimo.', author: 'Valentina R.', service: 'Microneedling / Dermapen' },
    { stars: 5, text: 'Me hice el lifting de pestañas y quedé encantada. La mirada se abre totalmente, muy natural.', author: 'Sofía G.', service: 'Lifting de Pestañas' },
    { stars: 4, text: 'Muy buena la limpieza premium, sentí la piel súper hidratada y luminosa por días.', author: 'Florencia D.', service: 'Limpieza Premium' },
    { stars: 5, text: 'La presoterapia es lo mejor para las piernas cansadas. Salís como nueva.', author: 'Andrea M.', service: 'Presoterapia' },
    { stars: 5, text: 'Me encanta el laminado de cejas, quedan perfectas y prolijas por semanas.', author: 'Camila T.', service: 'Laminado de Cejas' },
  ];

  return (
    <div className="booking-container fade-up">
      <div className="booking-header">
        <h2 className="booking-title">⭐ Reseñas</h2>
        <p className="booking-subtitle">Lo que dicen nuestras clientas</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reviews.map((review, i) => (
          <div key={i} className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--color-gold)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
            </div>
            <p style={{ fontSize: '0.88rem', fontStyle: 'italic', lineHeight: '1.5', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
              "{review.text}"
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>— {review.author}</span>
              <span>{review.service}</span>
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

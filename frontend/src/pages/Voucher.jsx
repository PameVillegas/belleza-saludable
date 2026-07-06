import { useNavigate } from 'react-router-dom';

function Voucher() {
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  const handleConsultar = () => {
    const clientName = clientSession?.name || 'Un cliente';
    const message = `Hola! Soy ${clientName} y quiero consultar por un *Voucher / Gift Card* 🎁. ¿Qué opciones tienen disponibles?`;
    const url = `https://wa.me/543388403225?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="professional-page fade-up">
      <div className="prof-header" style={{ marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🎁</span>
        <h2 className="prof-name">Voucher / Gift Card</h2>
        <p className="prof-specialty">¡Regalá bienestar!</p>
      </div>

      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">✨</span>
          <h3 className="prof-section-title">La opción perfecta para sorprender</h3>
        </div>
        <p className="prof-section-text">
          Sorprendé a alguien especial con una experiencia de cuidado y belleza. Nuestros vouchers son personalizables y se pueden usar en cualquier tratamiento o producto.
        </p>
      </div>

      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">💝</span>
          <h3 className="prof-section-title">¿Cómo funciona?</h3>
        </div>
        <div className="prof-info-list">
          <div className="prof-info-item">
            <span>1️⃣</span>
            <span>Elegís el monto o tratamiento que querés regalar</span>
          </div>
          <div className="prof-info-item">
            <span>2️⃣</span>
            <span>Te enviamos el voucher digital personalizado</span>
          </div>
          <div className="prof-info-item">
            <span>3️⃣</span>
            <span>La persona lo presenta al momento de su turno</span>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '1.5rem' }}
        onClick={handleConsultar}
      >
        💬 Consultar por WhatsApp
      </button>

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default Voucher;

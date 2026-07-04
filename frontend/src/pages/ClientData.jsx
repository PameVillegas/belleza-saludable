import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';

function ClientData() {
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  const [formData, setFormData] = useState({
    name: clientSession?.name || '',
    phone: clientSession?.phone || '',
    email: clientSession?.email || ''
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const service = JSON.parse(sessionStorage.getItem('selectedService') || 'null');
  const date = sessionStorage.getItem('selectedDate');
  const slot = JSON.parse(sessionStorage.getItem('selectedSlot') || 'null');

  if (!service || !date || !slot) {
    navigate('/turnos');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.phone || !formData.email) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          date: date,
          start_time: slot.start,
          client_name: formData.name,
          client_phone: formData.phone,
          client_email: formData.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al reservar el turno.');
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem('appointmentResult', JSON.stringify(data));
      navigate('/confirmacion');
    } catch {
      setError('Error de conexión. Intente nuevamente.');
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="booking-container fade-up">
      <Stepper currentStep={3} />
      <div className="booking-header">
        <h2 className="booking-title">Confirmar datos</h2>
        <p className="booking-subtitle">Verificá tus datos para confirmar el turno</p>
      </div>

      {/* Resumen del turno */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-beige)' }}>
        <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>💆 {service.name}</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)' }}>
          📅 {formatDate(date)} &nbsp; ⏰ {slot.start} - {slot.end} hs &nbsp; ⏱ {service.duration_minutes} min
        </p>
        {Number(service.price) > 0 && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>
            💰 ${Number(service.price).toLocaleString()}
          </p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre completo</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Tu nombre completo" required />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Teléfono / WhatsApp</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: 3388-123456" required />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/fecha-hora')}>
            ← Atrás
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Reservando...' : 'Confirmar turno ✓'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientData;

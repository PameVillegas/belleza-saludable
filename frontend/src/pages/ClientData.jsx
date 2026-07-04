import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';

function ClientData() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const service = JSON.parse(sessionStorage.getItem('selectedService') || 'null');
  const date = sessionStorage.getItem('selectedDate');
  const slot = JSON.parse(sessionStorage.getItem('selectedSlot') || 'null');

  if (!service || !date || !slot) {
    navigate('/');
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
    <div>
      <Stepper currentStep={3} />
      <h2 style={{ marginBottom: '1rem' }}>Tus datos</h2>

      {/* Resumen */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-bg)' }}>
        <p><strong>{service.name}</strong></p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
          📅 {formatDate(date)} &nbsp; ⏰ {slot.start} hs
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre completo</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Teléfono</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Ej: 11-1234-5678"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/fecha-hora')}>
            ← Atrás
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Reservando...' : 'Confirmar turno'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientData;

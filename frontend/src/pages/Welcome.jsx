import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Completá usuario y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Credenciales inválidas.');
        setLoading(false);
        return;
      }

      // Guardar sesión y entrar a la app
      sessionStorage.setItem('clientSession', JSON.stringify(data.admin));
      navigate('/inicio');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-card">
        <img src="/logobelleza.jpg" alt="Belleza Saludable" className="welcome-logo" />
        <h1 className="welcome-title">Belleza Saludable</h1>
        <p className="welcome-subtitle">Cosmetología · Cosmiatría · Dermatocosmiatría</p>

        <form onSubmit={handleLogin} className="welcome-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="welcome-footer">
          <button
            className="btn-admin"
            onClick={() => { window.location.href = '/panel.html'; }}
          >
            🔒 Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      const res = await fetch('/api/auth/client/login', {
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
      sessionStorage.setItem('clientSession', JSON.stringify(data.client));
      navigate('/inicio');
    } catch {
      setError('Error de conexión.');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim() || !phone.trim() || !username.trim() || !password.trim()) {
      setError('Completá todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/client/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: `${username.trim()}@bellezasaludable.com.ar`,
          username: username.trim(),
          password: password.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setSuccess('✓ Cuenta creada. Ya podés iniciar sesión.');
      setLoading(false);
      setTimeout(() => { setMode('login'); setSuccess(''); }, 2000);
    } catch {
      setError('Error de conexión.');
      setLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-card">
        <img src="/logobelleza.jpg" alt="Logo Belleza Saludable" className="welcome-logo" />
        <h1 className="welcome-title">Belleza Saludable</h1>
        <p className="welcome-subtitle">Cosmetología · Cosmiatría · Dermatocosmiatría</p>

        {error && <div className="error-message" role="alert">{error}</div>}
        {success && <div className="success-message" role="status" aria-live="polite">{success}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="welcome-form" noValidate aria-label="Formulario de inicio de sesión">
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu usuario" autoComplete="username" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.1rem', userSelect: 'none', background: 'none', border: 'none', padding: '0.25rem', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span aria-hidden="true">{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading} aria-busy={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              ¿No tenés cuenta?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setError(''); }} style={{ color: 'var(--color-sage-dark)', fontWeight: 500 }}>
                Registrarse
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="welcome-form" noValidate aria-label="Formulario de registro">
            <div className="form-group">
              <label htmlFor="regName">Nombre y apellido</label>
              <input type="text" id="regName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="regPhone">Teléfono / WhatsApp</label>
              <input type="tel" id="regPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 3388-123456" autoComplete="tel" />
            </div>
            <div className="form-group">
              <label htmlFor="regUser">Usuario</label>
              <input type="text" id="regUser" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Mínimo 3 caracteres" autoComplete="username" />
            </div>
            <div className="form-group">
              <label htmlFor="regPass">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} id="regPass" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 4 caracteres" autoComplete="new-password" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.1rem', userSelect: 'none', background: 'none', border: 'none', padding: '0.25rem', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span aria-hidden="true">{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading} aria-busy={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              ¿Ya tenés cuenta?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError(''); }} style={{ color: 'var(--color-sage-dark)', fontWeight: 500 }}>
                Iniciar sesión
              </a>
            </p>
          </form>
        )}

        <div className="welcome-footer">
          <button className="btn-admin" onClick={() => { window.location.href = '/panel.html'; }} aria-label="Acceso al panel de administración">
            <span aria-hidden="true">🔒</span> Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

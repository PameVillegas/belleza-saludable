import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <p className="splash-welcome">Bienvenidos a</p>
        <img src="/logobelleza.jpg" alt="Belleza Saludable" className="splash-logo" />
        <h1 className="splash-name">Belleza Saludable</h1>
      </div>
    </div>
  );
}

export default Splash;

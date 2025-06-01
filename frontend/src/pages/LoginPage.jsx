import React, { useState } from 'react';
import '../App.css';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // 🔍 AGREGAR MÁS DEBUGGING
      const responseBody = await response.text();
      let data = {};
      try {
        data = JSON.parse(responseBody);
        console.log('📥 Response JSON:', data);
      } catch (e) {
        console.warn('No se pudo parsear la respuesta como JSON:', e);
      }

      if (response.ok && data.success) {
        // Llamar a onLogin con los datos del usuario Y el token de sesión
        onLogin(data.user, data.sessionToken); // ← Pasar ambos parámetros
        
        // Opcional: mostrar mensaje de éxito
        console.log('Login exitoso:', data.user.name);
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center login-page-bg p-4 sm:p-6 lg:p-8">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight">Barber<span className="text-indigo-600">RD</span></h1>
        </div>
        <div className="bg-white py-8 px-6 shadow-2xl rounded-xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email_login" className="sr-only">Email</label>
              <input 
                id="email_login" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="appearance-none block w-full pl-3 pr-3 py-2.5 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                placeholder="tu@email.com" 
              />
            </div>
            <div>
              <label htmlFor="password_login" className="sr-only">Contraseña</label>
              <input 
                id="password_login" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="appearance-none block w-full pl-3 pr-3 py-2.5 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                placeholder="••••••••" 
              />
            </div>
            <div className="pt-2"></div>
            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition-colors"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-sm text-center space-x-2">
            <a 
              href="#" 
              onClick={e => { 
                e.preventDefault(); 
                setShowForgotPassword(true); 
              }} 
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
            <span className="text-slate-300">|</span>
            <a 
              href="#" 
              onClick={e => { 
                e.preventDefault(); 
                setShowRegistration(true); 
              }} 
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Crear cuenta
            </a>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-500">&copy; {new Date().getFullYear()} BarberRD. Todos los derechos reservados.</p>
      </div>
      {/* Aquí irían los modales para el registro y la recuperación de contraseña */}
    </div>
  );
};

export default LoginPage;

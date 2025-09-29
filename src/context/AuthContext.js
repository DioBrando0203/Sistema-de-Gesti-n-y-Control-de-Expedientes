import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const usuarioGuardado = localStorage.getItem('sesion_usuario');
    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch (error) {
        localStorage.removeItem('sesion_usuario');
      }
    }
    setCargando(false);
  }, []);

  const login = async (nombre_usuario, password) => {
    try {
      const response = await window.electronAPI.auth.login(nombre_usuario, password);

      if (response.success) {
        const usuarioData = response.usuario;
        setUsuario(usuarioData);
        localStorage.setItem('sesion_usuario', JSON.stringify(usuarioData));
        return usuarioData;
      } else {
        throw new Error(response.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('sesion_usuario');
  };

  const estaAutenticado = () => {
    return !!usuario;
  };

  const esAdministrador = () => {
    return usuario?.rol === 'administrador';
  };

  const estaCargando = () => {
    return cargando;
  };

  const value = {
    usuario,
    login,
    logout,
    estaAutenticado,
    esAdministrador,
    estaCargando
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;
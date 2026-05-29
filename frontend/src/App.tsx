import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:3000';

interface TransferResponse { id: string; status: string; }
interface StatusResponse { status: string; }

export default function App() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Esperando registro...');
  const [statusColor, setStatusColor] = useState('#f59e0b');
  const [isLoading, setIsLoading] = useState(false);
  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, []);

  const registrarUsuario = async () => {
    if (!nombre || !email || !password) {
      setStatus('COMPLETA_TODOS_LOS_CAMPOS');
      setStatusColor('#ef4444');
      return;
    }
    setIsLoading(true);
    try {
      setStatus('PROCESANDO...');
      setStatusColor('#f59e0b');

      const response = await fetch(`${API_URL}/api/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: nombre, amount: 0 })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: TransferResponse = await response.json();

      if (intervalIdRef.current) clearInterval(intervalIdRef.current);

      const poll = window.setInterval(async () => {
        try {
          const resStatus = await fetch(`${API_URL}/api/status/${data.id}`);
          const statusData: StatusResponse = await resStatus.json();
          console.log("Estado recibido:", statusData.status);
          setStatus(statusData.status);
          if (statusData.status === 'APROBADO') {
            setStatusColor('#10b981');
            clearInterval(poll);
            setIsLoading(false);
          } else if (statusData.status === 'ERROR_TIMEOUT') {
            setStatusColor('#ef4444');
            clearInterval(poll);
            setIsLoading(false);
          } else {
            setStatusColor('#f59e0b');
          }
        } catch (error) {
          console.error("Polling error:", error);
          setStatus('ERROR_CONSULTANDO_ESTADO');
          setStatusColor('#ef4444');
          clearInterval(poll);
          setIsLoading(false);
        }
      }, 1000);

      intervalIdRef.current = poll;
    } catch (error) {
      console.error(error);
      setStatus('ERROR_ENVIANDO_REGISTRO');
      setStatusColor('#ef4444');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', textAlign: 'center', padding: 50 }}>
      <h1>Lite Bank - Registro de Usuario</h1>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 12, display: 'inline-block', border: '1px solid #334155' }}>
        <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} disabled={isLoading} style={{ padding: 10, fontSize: 16, margin: 10, borderRadius: 6, border: 'none', width: '80%' }} />
        <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} style={{ padding: 10, fontSize: 16, margin: 10, borderRadius: 6, border: 'none', width: '80%' }} />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} style={{ padding: 10, fontSize: 16, margin: 10, borderRadius: 6, border: 'none', width: '80%' }} />
        <br />
        <button onClick={registrarUsuario} disabled={isLoading} style={{ padding: 10, fontSize: 16, margin: 10, borderRadius: 6, border: 'none', background: '#ffd100', color: '#000', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Registrando...' : 'Registrar'}
        </button>
        <div id="status-box" style={{ marginTop: 20, fontSize: 24, fontWeight: 'bold', color: statusColor }}>Estado: {status}</div>
      </div>
    </div>
  );
}
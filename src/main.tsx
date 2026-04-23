import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.scss';
import StatusPage from './status';

const checkServerStatus = async () => {
  const response = await fetch('/api/status');
  const { status } = await response.json();

  if (status === 'offline' && window.location.pathname !== '/offline') {
    window.location.replace('/');
  }
};

checkServerStatus();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StatusPage />
  </StrictMode>,
)
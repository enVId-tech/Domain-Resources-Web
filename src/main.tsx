import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.scss';
import StatusPage from './status';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StatusPage />
  </StrictMode>,
)
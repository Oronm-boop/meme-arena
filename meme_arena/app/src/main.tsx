import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer';
// @ts-ignore
window.Buffer = Buffer;
import './index.css'
import './i18n/config'; // Import i18n config
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { init, setFocus, navigateByDirection, getCurrentFocusKey } from '@noriginmedia/norigin-spatial-navigation';
import App from './App.tsx';
import { fetchServerBaseUrl } from './api/client';
import './styles/tailwind.css';

init({
  debug: false,
  visualDebug: false,
});

// Pre-fetch server LAN IP for QR code URLs (needed on Tizen emulator)
fetchServerBaseUrl();

// Expose spatial nav API for debugging on TV
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__SN = { setFocus, navigateByDirection, getCurrentFocusKey };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

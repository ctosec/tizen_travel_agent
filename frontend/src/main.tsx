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

// Scale 1920×1080 design to fit any TV resolution (uniform, no distortion)
function applyViewportScale() {
  const root = document.getElementById('root');
  if (!root) return;
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  root.style.transform = `scale(${scale})`;
  // Center if viewport aspect ratio differs from 16:9
  root.style.marginLeft = `${(window.innerWidth - 1920 * scale) / 2}px`;
  root.style.marginTop = `${(window.innerHeight - 1080 * scale) / 2}px`;
}
applyViewportScale();
window.addEventListener('resize', applyViewportScale);

// TV browser: cursor hidden via CSS, D-pad arrow keys still fire keydown events
// which norigin-spatial-navigation handles. Packaged Tizen app disables pointer
// entirely via config.xml pointing-device-support="disable".

// Expose spatial nav API for debugging on TV
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__SN = { setFocus, navigateByDirection, getCurrentFocusKey };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { init, setFocus, navigateByDirection, getCurrentFocusKey } from '@noriginmedia/norigin-spatial-navigation';
import App from './App.tsx';
import { parseLaunchParams } from './stores/travelConfigStore';
import './styles/tailwind.css';

init({
  debug: false,
  visualDebug: false,
});

// Parse city/country from Tizen app_control or URL query params
parseLaunchParams();

// Scale 1920x1080 design to fit any TV resolution (uniform, no distortion)
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

// Expose spatial nav API for debugging on TV
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__SN = { setFocus, navigateByDirection, getCurrentFocusKey };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

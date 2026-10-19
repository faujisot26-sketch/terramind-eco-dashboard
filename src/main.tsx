import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../terramind_eco_dashboard-2';
import './styles.css';

function StartupFallback() {
  return (
    <main className="startup-fallback">
      <div className="startup-mark">✳</div>
      <p className="startup-eyebrow">TERRAMIND</p>
      <h1>Your next small step starts here.</h1>
      <p>TerraMind could not start. Refresh the page, or clear this site’s saved data and try again.</p>
      <button onClick={() => window.location.reload()}>Refresh TerraMind</button>
    </main>
  );
}

class StartupBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <StartupFallback /> : this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StartupBoundary>
      <App />
    </StartupBoundary>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.warn('Offline support could not be enabled:', error);
    });
  });
}

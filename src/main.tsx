import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/baloo-2';
import '@fontsource-variable/nunito';
import '@fontsource-variable/jetbrains-mono';

import { registerServiceWorker } from '@shared/services/register-service-worker';

import { App } from './app';
import './index.css';

/**
 * The worker that makes the app installable. Caches nothing, so shipping an
 * update works exactly as it does without it.
 */
registerServiceWorker();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

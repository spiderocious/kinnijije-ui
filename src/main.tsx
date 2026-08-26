import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/baloo-2';
import '@fontsource-variable/nunito';
import '@fontsource-variable/jetbrains-mono';

import { App } from './app';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

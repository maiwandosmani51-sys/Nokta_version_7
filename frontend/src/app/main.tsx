import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import { AppProviders } from '@/app/providers/AppProviders';
import { initializeThemePreference } from '@/app/providers/ThemeProvider';
import '@/locales/i18n';
import '@/styles/index.css';

initializeThemePreference();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
        <App />
    </AppProviders>
  </React.StrictMode>
);

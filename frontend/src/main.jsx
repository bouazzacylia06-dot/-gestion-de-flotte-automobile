import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { KeycloakProvider } from './auth/KeycloakProvider';
import apolloClient from './api/apolloClient';
import App from './App';
import './index.css';
import './i18n/index.js'; // Internationalisation FR/EN

// Audit d'accessibilité axe-core en mode développement uniquement
if (import.meta.env.DEV) {
  import('@axe-core/react').then(({ default: axe }) => {
    axe(React, ReactDOM, 1000);
  });
}

// StrictMode retiré : keycloak-js ne supporte pas le double-mount de React 18 StrictMode
ReactDOM.createRoot(document.getElementById('root')).render(
  <KeycloakProvider>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </KeycloakProvider>
);

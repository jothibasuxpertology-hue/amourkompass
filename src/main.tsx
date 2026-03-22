import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister existing Service Workers (Permanent Fix)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      registrations.forEach(registration => {
        registration.unregister()
          .then(success => {
            if (success) console.log('SW unregistered successfully');
          });
      });
    })
    .catch(err => console.error('Error unregistering SW:', err));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { adminBasePath } from './config';
import { App } from './App';
import { ToastProvider } from './components/Toast';
import '../../css/admin.css';

const el = document.getElementById('aifinops-admin');

if (el) {
  createRoot(el).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter basename={adminBasePath()}>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

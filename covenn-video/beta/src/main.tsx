import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './ui/styles/fonts.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/print.css';
import { ErrorBoundary } from './app/ErrorBoundary';
import { createAppRouter } from './app/router';
import { DemoProvider } from './store/DemoStore';

const router = createAppRouter();
const root = document.getElementById('root');
if (!root) throw new Error('Élément racine introuvable');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <DemoProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </DemoProvider>
    </ErrorBoundary>
  </StrictMode>,
);

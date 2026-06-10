import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/styles/global.css';
import App from '@/App';

async function enableMocking() {
  const shouldEnableMocking = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW !== 'false';

  if (shouldEnableMocking) {
    const { worker } = await import('@/mocks/browser');
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element #root was not found.');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

import { setupWorker } from 'msw/browser';
import { handlers } from '@/test/handlers';

export const worker = setupWorker(...handlers);

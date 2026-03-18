import { setupWorker } from 'msw/browser';
import { handlers } from '@/test/handlers';

// 가상서버
export const worker = setupWorker(...handlers);

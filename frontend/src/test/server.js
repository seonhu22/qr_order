import { setupServer } from 'msw/node';
import { handlers } from '@/test/handlers';
import { consumerMenuHandlers } from '@/apps/consumer/features/order-shell/mock/consumerMenuHandlers';

export const server = setupServer(...consumerMenuHandlers, ...handlers);

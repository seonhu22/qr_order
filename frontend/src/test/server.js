import { setupServer } from 'msw/node';
import { handlers } from '@/test/handlers';
import { consumerMenuHandlers } from '@/apps/consumer/features/order-shell/mock/consumerMenuHandlers';
import { consumerApiHandlers } from '@/apps/consumer/features/order-shell/mock/consumerApiHandlers';

export const server = setupServer(...consumerApiHandlers, ...consumerMenuHandlers, ...handlers);

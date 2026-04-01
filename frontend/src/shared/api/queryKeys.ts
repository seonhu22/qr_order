export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  menu: {
    admin: ['menu', 'admin'] as const,
  },
  dashboard: {
    info: ['dashboard', 'info'] as const,
  },
} as const;

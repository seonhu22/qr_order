import { defineConfig } from 'orval';

export default defineConfig({
  qrorder: {
    input: {
      target: './openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/generated',
      schemas: './src/generated/types',
      client: 'react-query',
      mock: true,
      override: {
        mutator: {
          path: './src/shared/lib/httpClient.ts',
          name: 'httpClient',
        },
      },
    },
  },
});

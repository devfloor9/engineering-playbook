import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared/components': path.resolve(__dirname, '../shared/src/components'),
    },
    dedupe: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
  },
  optimizeDeps: {
    include: ['framer-motion', 'lucide-react'],
  },
  base: '/engineering-playbook/agentic-block5-operations/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});

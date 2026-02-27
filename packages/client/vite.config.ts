import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5175,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

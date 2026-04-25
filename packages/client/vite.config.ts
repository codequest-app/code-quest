import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: [reactCompilerPreset()],
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/ws': {
        target: `http://localhost:${process.env.PORT ?? 3000}`,
        ws: true,
      },
      '/socket.io': {
        target: `http://localhost:${process.env.PORT ?? 3000}`,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});

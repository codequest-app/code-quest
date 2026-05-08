import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import JavaScriptObfuscator from 'vite-plugin-javascript-obfuscator';
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
    JavaScriptObfuscator({
      apply: 'build',
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        stringArray: true,
        stringArrayEncoding: ['rc4'],
        stringArrayThreshold: 0.5,
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
    allowedHosts: ['.trycloudflare.com'],
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
  optimizeDeps: {
    include: ['mermaid'],
  },
  build: {
    outDir: '../server/dist/public',
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'mermaid',
              test: /mermaid/,
              priority: 20,
              minSize: 0,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
              minSize: 0,
            },
          ],
        },
      },
    },
  },
});
